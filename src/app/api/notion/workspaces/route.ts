import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const workspaces = await prisma.notionWorkspace.findMany({
    include: { favoritePages: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  // Strip access tokens from response
  return NextResponse.json(
    workspaces.map((w) => ({ ...w, accessToken: undefined }))
  );
}

// POST: connect a workspace via internal integration token
export async function POST(req: NextRequest) {
  const { token, name } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  // Validate the token by calling Notion's /users/me (bot info)
  const meRes = await fetch("https://api.notion.com/v1/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!meRes.ok) {
    return NextResponse.json(
      { error: "Invalid token — could not connect to Notion" },
      { status: 400 }
    );
  }

  const meData = await meRes.json();
  const botId = meData.id || "";
  const botName = meData.name || name || "Notion Workspace";

  // Try to get workspace info via search (workspace_id isn't directly available from /users/me)
  // Use the bot ID as a unique workspace identifier for internal integrations
  const workspaceId = `internal_${botId}`;

  const workspace = await prisma.notionWorkspace.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      workspaceName: name || botName,
      accessToken: token,
      botId,
    },
    update: {
      workspaceName: name || botName,
      accessToken: token,
      botId,
    },
    include: { favoritePages: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(
    { ...workspace, accessToken: undefined },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.notionWorkspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
