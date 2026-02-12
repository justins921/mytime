import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listConversations, getUsersList, resolveUserIds } from "@/lib/slack";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  // Support comma-separated workspace IDs for unified view
  const workspaceIds = workspaceId.split(",").map((id) => id.trim()).filter(Boolean);

  const allConversations: {
    id: string;
    name: string;
    is_channel: boolean;
    is_im: boolean;
    is_mpim: boolean;
    user: string | null;
    workspaceId: string;
    workspaceName: string;
    has_unreads: boolean;
    unread_count: number;
  }[] = [];
  const mergedUserMap: Record<string, string> = {};

  await Promise.all(
    workspaceIds.map(async (wsId) => {
      const workspace = await prisma.slackWorkspace.findUnique({
        where: { id: wsId },
      });
      if (!workspace || workspace.userId !== user.id) return;

      const [convResult, usersResult] = await Promise.all([
        listConversations(workspace.accessToken),
        getUsersList(workspace.accessToken),
      ]);

      if (!convResult.ok) return;

      // Build user map
      const userMap: Record<string, string> = {};
      if (usersResult.ok && Array.isArray(usersResult.members)) {
        for (const u of usersResult.members) {
          const name = u.profile?.display_name || u.real_name || u.name || u.id;
          userMap[u.id] = name;
          mergedUserMap[u.id] = name;
        }
      }

      // Resolve any DM users not found in the initial users.list
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unresolvedDmUserIds = (convResult.channels || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((ch: any) => ch.is_im && ch.user && !userMap[ch.user])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ch: any) => ch.user as string);

      if (unresolvedDmUserIds.length > 0) {
        const resolved = await resolveUserIds(workspace.accessToken, unresolvedDmUserIds, userMap);
        Object.assign(userMap, resolved);
        Object.assign(mergedUserMap, resolved);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversations = (convResult.channels || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name || (ch.user ? userMap[ch.user] : null) || ch.id,
        is_channel: !!(ch.is_channel || ch.is_group),
        is_im: !!ch.is_im,
        is_mpim: !!ch.is_mpim,
        user: ch.user || null,
        workspaceId: workspace.id,
        workspaceName: workspace.teamName,
        has_unreads: !!ch.has_unreads || (ch.unread_count_display ?? 0) > 0,
        unread_count: ch.unread_count_display ?? 0,
      }));

      allConversations.push(...conversations);
    })
  );

  return NextResponse.json({ conversations: allConversations, userMap: mergedUserMap });
}
