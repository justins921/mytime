import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

const MONDAY_API = "https://api.monday.com/v2";

interface MondayItem {
  id: string;
  name: string;
  state: string;
  url: string;
  updated_at: string;
  created_at: string;
  column_values: { id: string; title: string; text: string; value: string | null }[];
  board: { id: string; name: string };
  group: { id: string; title: string };
}

interface MondayBoard {
  id: string;
  name: string;
}

async function getSettings(userId: string) {
  let settings = await prisma.settings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId } });
  }
  return settings;
}

async function mondayQuery(query: string, token: string) {
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Monday.com API ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`Monday.com: ${data.errors[0].message}`);
  }
  return data;
}

/**
 * GET /api/monday?action=boards — list boards
 * GET /api/monday?action=tasks  — get items assigned to you
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const settings = await getSettings(user.id);
  const token = settings.mondayApiToken;
  if (!token) {
    return NextResponse.json({ error: "Monday.com API token not configured. Add it in Settings." }, { status: 400 });
  }

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "boards") {
      const data = await mondayQuery(`{ boards (limit: 50) { id name } }`, token);
      return NextResponse.json(data.data?.boards || []);
    }

    if (action === "tasks") {
      // Get current user
      const meData = await mondayQuery(`{ me { id name } }`, token);
      const meId = meData.data?.me?.id;

      // Get boards user has access to
      const boardsData = await mondayQuery(
        `{ boards (limit: 50, state: active) { id name } }`,
        token
      );
      const boards: MondayBoard[] = boardsData.data?.boards || [];

      const allItems: Record<string, MondayItem[]> = {};

      for (const board of boards) {
        try {
          // Get items from board - filter assigned to current user
          const itemsData = await mondayQuery(
            `{
              boards (ids: ${board.id}) {
                items_page (limit: 100) {
                  items {
                    id name state url updated_at created_at
                    column_values { id title text value }
                    group { id title }
                  }
                }
              }
            }`,
            token
          );

          const rawItems = itemsData.data?.boards?.[0]?.items_page?.items || [];
          const items: MondayItem[] = [];

          for (const item of rawItems) {
            // Filter for items assigned to current user (people column)
            const isAssigned = item.column_values?.some(
              (cv: { id: string; title: string; text: string; value: string | null }) => {
                if (!cv.value) return false;
                try {
                  const val = JSON.parse(cv.value);
                  if (val?.personsAndTeams) {
                    return val.personsAndTeams.some((p: { id: number }) => String(p.id) === String(meId));
                  }
                } catch {
                  // not a people column
                }
                return false;
              }
            );

            // Include item if assigned, or if no people columns exist (include all)
            const hasPeopleColumn = item.column_values?.some(
              (cv: { title: string }) => cv.title.toLowerCase().includes("person") || cv.title.toLowerCase().includes("owner") || cv.title.toLowerCase().includes("assignee")
            );

            if (isAssigned || !hasPeopleColumn) {
              // Skip completed items
              if (item.state === "deleted" || item.state === "archived") continue;

              items.push({
                ...item,
                board: { id: board.id, name: board.name },
              });
            }
          }

          if (items.length > 0) {
            allItems[board.id] = items;
          }
        } catch {
          // board may not be accessible
        }
      }

      return NextResponse.json({
        boards: boards.filter((b) => allItems[b.id]?.length > 0).map((b) => ({ id: b.id, name: b.name })),
        itemsByBoard: allItems,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Monday.com API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/monday — Create a Work OS task from a Monday.com item
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { mondayItem, clientId, projectId } = body as {
    mondayItem: MondayItem;
    clientId: string;
    projectId: string;
  };

  if (!clientId || !projectId) {
    return NextResponse.json({ error: "clientId and projectId are required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { id: clientId, userId: user.id } },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Extract due date from column values
  let dueDate: Date | null = null;
  for (const cv of mondayItem.column_values || []) {
    if (cv.title.toLowerCase().includes("date") && cv.text) {
      const d = new Date(cv.text);
      if (!isNaN(d.getTime())) {
        dueDate = d;
        break;
      }
    }
  }

  // Extract description from long text columns
  let description = "";
  for (const cv of mondayItem.column_values || []) {
    if (cv.title.toLowerCase().includes("text") || cv.title.toLowerCase().includes("description") || cv.title.toLowerCase().includes("notes")) {
      if (cv.text) {
        description = cv.text;
        break;
      }
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title: mondayItem.name || "Monday.com Item",
      description,
      priority: "P2",
      status: "Backlog",
      url: mondayItem.url || "",
      clickupTaskId: `monday_${mondayItem.id}`,
      dueDate,
      tags: ["monday"].join(","),
    },
    include: { project: { include: { client: true } } },
  });

  // Auto-dismiss from triage
  await prisma.triageDismissal.upsert({
    where: { userId_clickupTaskId: { userId: user.id, clickupTaskId: `monday_${mondayItem.id}` } },
    create: { userId: user.id, clickupTaskId: `monday_${mondayItem.id}`, source: "monday", action: "added" },
    update: { action: "added" },
  });

  return NextResponse.json(task);
}
