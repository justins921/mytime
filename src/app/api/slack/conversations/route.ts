import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listConversations, getUsersList } from "@/lib/slack";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const workspace = await prisma.slackWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const [convResult, usersResult] = await Promise.all([
    listConversations(workspace.accessToken),
    getUsersList(workspace.accessToken),
  ]);

  if (!convResult.ok) {
    return NextResponse.json({ error: convResult.error }, { status: 400 });
  }

  // Build user map for DM display names
  const userMap: Record<string, string> = {};
  if (usersResult.ok && Array.isArray(usersResult.members)) {
    for (const u of usersResult.members) {
      userMap[u.id] = u.profile?.display_name || u.real_name || u.name || u.id;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations = (convResult.channels || []).map((ch: any) => ({
    id: ch.id,
    name: ch.name || (ch.user ? userMap[ch.user] : null) || ch.id,
    is_channel: !!(ch.is_channel || ch.is_group),
    is_im: !!ch.is_im,
    is_mpim: !!ch.is_mpim,
    user: ch.user || null,
  }));

  return NextResponse.json({ conversations, userMap });
}
