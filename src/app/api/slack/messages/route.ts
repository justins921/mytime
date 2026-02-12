import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConversationHistory, postMessage } from "@/lib/slack";

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

  const result = await getConversationHistory(workspace.accessToken, channel);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ messages: result.messages || [] });
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
