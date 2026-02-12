import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CLICKUP_API = "https://api.clickup.com/api/v2";

interface ClickUpTeam {
  id: string | number;
  name: string;
}

interface ClickUpTaskItem {
  id: string;
  name: string;
  description?: string;
  priority?: { id: number; priority: string };
  url?: string;
  tags?: { name: string }[];
}

async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }
  return settings;
}

async function clickupFetch(path: string, token: string) {
  const res = await fetch(`${CLICKUP_API}${path}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * GET /api/clickup?action=workspaces  — list workspaces (teams)
 * GET /api/clickup?action=user        — get current ClickUp user
 * GET /api/clickup?action=tasks       — get tasks with user activity across all mapped workspaces
 */
export async function GET(req: NextRequest) {
  const settings = await getSettings();
  const token = settings.clickupApiToken;

  if (!token) {
    return NextResponse.json(
      { error: "ClickUp API token not configured. Add it in Settings." },
      { status: 400 }
    );
  }

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "workspaces") {
      const data = await clickupFetch("/team", token);
      return NextResponse.json(data.teams || []);
    }

    if (action === "user") {
      const data = await clickupFetch("/user", token);
      return NextResponse.json(data.user);
    }

    if (action === "tasks") {
      // Get user ID first
      const userData = await clickupFetch("/user", token);
      const userId = userData.user.id;

      // Get workspaces
      const teamsData = await clickupFetch("/team", token);
      const teams: ClickUpTeam[] = teamsData.teams || [];

      // Fetch tasks from each workspace where user is assignee or watcher
      const allTasks: Record<string, ClickUpTaskItem[]> = {};

      for (const team of teams) {
        const teamId = String(team.id);
        const teamTasks: ClickUpTaskItem[] = [];

        // Get tasks assigned to user
        try {
          const assigned = await clickupFetch(
            `/team/${teamId}/task?assignees[]=${userId}&include_closed=false&order_by=updated&reverse=true&subtasks=true&page=0`,
            token
          );
          if (assigned.tasks) {
            teamTasks.push(...(assigned.tasks as ClickUpTaskItem[]));
          }
        } catch {
          // workspace might not have tasks endpoint access
        }

        // Get tasks where user is a watcher
        try {
          const watched = await clickupFetch(
            `/team/${teamId}/task?watchers[]=${userId}&include_closed=false&order_by=updated&reverse=true&page=0`,
            token
          );
          if (watched.tasks) {
            // Deduplicate by task ID
            const existingIds = new Set(teamTasks.map((t) => t.id));
            for (const task of watched.tasks as ClickUpTaskItem[]) {
              if (!existingIds.has(task.id)) {
                teamTasks.push(task);
              }
            }
          }
        } catch {
          // watchers filter might not be supported in all plans
        }

        allTasks[teamId] = teamTasks;
      }

      return NextResponse.json({
        teams: teams.map((t) => ({ id: String(t.id), name: t.name })),
        tasksByTeam: allTasks,
        userId,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ClickUp API error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clickup — Create a MyTime task from a ClickUp task
 * Body: { clickupTask, clientId, projectId }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clickupTask, clientId, projectId } = body as {
    clickupTask: ClickUpTaskItem;
    clientId: string;
    projectId: string;
  };

  if (!clientId || !projectId) {
    return NextResponse.json(
      { error: "clientId and projectId are required" },
      { status: 400 }
    );
  }

  // Create a MyTime task from the ClickUp task
  const task = await prisma.task.create({
    data: {
      projectId,
      title: clickupTask.name || "ClickUp Task",
      description: clickupTask.description || "",
      priority: mapClickUpPriority(clickupTask.priority?.id),
      status: "Backlog",
      url: clickupTask.url || "",
      clickupTaskId: clickupTask.id || null,
      tags: [
        "clickup",
        ...(clickupTask.tags?.map((t) => t.name) || []),
      ]
        .filter(Boolean)
        .join(","),
    },
    include: { project: { include: { client: true } } },
  });

  // Auto-dismiss the task from triage after adding to MyTime
  if (clickupTask.id) {
    await prisma.triageDismissal.upsert({
      where: { clickupTaskId: clickupTask.id },
      create: { clickupTaskId: clickupTask.id, action: "added" },
      update: { action: "added" },
    });
  }

  return NextResponse.json(task);
}

function mapClickUpPriority(clickupPriorityId: number | undefined): string {
  // ClickUp priorities: 1=Urgent, 2=High, 3=Normal, 4=Low
  switch (clickupPriorityId) {
    case 1:
    case 2:
      return "P1";
    case 3:
      return "P2";
    case 4:
      return "P3";
    default:
      return "P2";
  }
}
