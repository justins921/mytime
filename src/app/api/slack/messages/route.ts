import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getConversationHistory,
  postMessage,
  getUsersList,
  resolveUserIds,
  userDisplayName,
} from "@/lib/slack";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const channel = req.nextUrl.searchParams.get("channel");

  if (!workspaceId || !channel) {
    return NextResponse.json(
      { error: "workspaceId and channel required" },
      { status: 400 }
    );
  }

  const workspace = await prisma.slackWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const [result, usersResult] = await Promise.all([
    getConversationHistory(workspace.accessToken, channel),
    getUsersList(workspace.accessToken),
  ]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Build user map from users.list
  const userMap: Record<string, string> = {};
  if (usersResult.ok && Array.isArray(usersResult.members)) {
    for (const u of usersResult.members) {
      userMap[u.id] = userDisplayName(u);
    }
  }

  // Resolve any message authors not in users.list
  const messages = result.messages || [];
  const messageUserIds = messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.user as string | undefined)
    .filter((id: string | undefined): id is string => !!id && !userMap[id]);

  if (messageUserIds.length > 0) {
    const resolved = await resolveUserIds(
      workspace.accessToken,
      messageUserIds,
      userMap
    );
    Object.assign(userMap, resolved);
  }

  return NextResponse.json({ messages, userMap });
}

export async function POST(req: NextRequest) {
  const { workspaceId, channel, text } = await req.json();

  if (!workspaceId || !channel || !text?.trim()) {
    return NextResponse.json(
      { error: "workspaceId, channel, and text required" },
      { status: 400 }
    );
  }

  const workspace = await prisma.slackWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const result = await postMessage(workspace.accessToken, channel, text.trim());

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
