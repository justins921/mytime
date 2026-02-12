import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const workspaces = await prisma.notionWorkspace.findMany({
    where: { userId: user.id },
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
  const { user, res } = await getAuthUser();
  if (!user) return res;

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
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    create: {
      workspaceId,
      workspaceName: name || botName,
      accessToken: token,
      botId,
      userId: user.id,
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
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await req.json();

  // Verify ownership
  const existing = await prisma.notionWorkspace.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notionWorkspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
