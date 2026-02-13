import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

const TRELLO_API = "https://api.trello.com/1";

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  url: string;
  due: string | null;
  dateLastActivity: string;
  labels: { id: string; name: string; color: string }[];
  idBoard: string;
  idList: string;
  list?: { name: string };
  board?: { name: string };
}

interface TrelloBoard {
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

function parseToken(raw: string): { key: string; token: string } | null {
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1) return null;
  const key = raw.slice(0, colonIdx).trim();
  const token = raw.slice(colonIdx + 1).trim();
  if (!key || !token) return null;
  return { key, token };
}

async function trelloFetch(path: string, key: string, token: string) {
  const separator = path.includes("?") ? "&" : "?";
  const res = await fetch(`${TRELLO_API}${path}${separator}key=${key}&token=${token}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * GET /api/trello?action=boards — list boards
 * GET /api/trello?action=tasks  — get cards assigned to you
 */
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const settings = await getSettings(user.id);
  const raw = settings.trelloApiToken;
  if (!raw) {
    return NextResponse.json({ error: "Trello API token not configured. Add it in Settings." }, { status: 400 });
  }

  const creds = parseToken(raw);
  if (!creds) {
    return NextResponse.json({ error: "Invalid Trello token format. Use key:token format." }, { status: 400 });
  }

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "boards") {
      const boards = await trelloFetch("/members/me/boards?fields=name", creds.key, creds.token);
      return NextResponse.json(boards || []);
    }

    if (action === "tasks") {
      // Get cards assigned to the authenticated member
      const cards: TrelloCard[] = await trelloFetch(
        "/members/me/cards?fields=name,desc,url,due,dateLastActivity,labels,idBoard,idList",
        creds.key,
        creds.token
      );

      // Get boards for context
      const boards: TrelloBoard[] = await trelloFetch("/members/me/boards?fields=name", creds.key, creds.token);
      const boardMap: Record<string, string> = {};
      for (const b of boards) boardMap[b.id] = b.name;

      // Group cards by board
      const cardsByBoard: Record<string, TrelloCard[]> = {};
      for (const card of cards) {
        if (!cardsByBoard[card.idBoard]) cardsByBoard[card.idBoard] = [];
        card.board = { name: boardMap[card.idBoard] || "Unknown Board" };
        cardsByBoard[card.idBoard].push(card);
      }

      // Sort each board's cards by dateLastActivity desc
      for (const boardId of Object.keys(cardsByBoard)) {
        cardsByBoard[boardId].sort(
          (a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime()
        );
      }

      return NextResponse.json({
        boards: boards.map((b) => ({ id: b.id, name: b.name })),
        cardsByBoard,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trello API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/trello — Create a MyTime task from a Trello card
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { trelloCard, clientId, projectId } = body as {
    trelloCard: TrelloCard;
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

  const task = await prisma.task.create({
    data: {
      projectId,
      title: trelloCard.name || "Trello Card",
      description: trelloCard.desc || "",
      priority: "P2",
      status: "Backlog",
      url: trelloCard.url || "",
      clickupTaskId: `trello_${trelloCard.id}`,
      dueDate: trelloCard.due ? new Date(trelloCard.due) : null,
      tags: ["trello", ...(trelloCard.labels?.map((l) => l.name).filter(Boolean) || [])].join(","),
    },
    include: { project: { include: { client: true } } },
  });

  // Auto-dismiss from triage
  await prisma.triageDismissal.upsert({
    where: { userId_clickupTaskId: { userId: user.id, clickupTaskId: `trello_${trelloCard.id}` } },
    create: { userId: user.id, clickupTaskId: `trello_${trelloCard.id}`, source: "trello", action: "added" },
    update: { action: "added" },
  });

  return NextResponse.json(task);
}
