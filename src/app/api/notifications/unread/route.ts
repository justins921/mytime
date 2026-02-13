import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/notifications/unread
 * Returns unread counts for sidebar notification dots:
 * - messages: total Slack unread count
 * - email: unread Gmail/Outlook emails (estimated from recent)
 * - support: tickets with status "in_progress" or "resolved" (admin responded)
 */
export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  let messagesUnread = 0;
  let supportUnread = 0;

  // Slack unread: check workspaces and sum up unreads
  try {
    const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
    if (settings) {
      const workspaces = await prisma.slackWorkspace.findMany({
        where: { userId: user.id },
        select: { accessToken: true },
      });

      for (const ws of workspaces) {
        try {
          const slackRes = await fetch("https://slack.com/api/conversations.list?types=im,mpim&limit=100&exclude_archived=true", {
            headers: { Authorization: `Bearer ${ws.accessToken}` },
          });
          const data = await slackRes.json();
          if (data.ok && data.channels) {
            for (const ch of data.channels) {
              if (ch.has_unreads || (ch.unread_count_display ?? 0) > 0) {
                messagesUnread += ch.unread_count_display ?? 1;
              }
            }
          }
        } catch {
          // skip this workspace
        }
      }
    }
  } catch {
    // ignore
  }

  // Support: count tickets where admin has responded (status changed from "open")
  try {
    supportUnread = await prisma.supportTicket.count({
      where: {
        userId: user.id,
        status: { in: ["in_progress", "resolved"] },
      },
    });
  } catch {
    // ignore
  }

  // Email: we won't make external API calls here for performance.
  // Instead the email page itself handles unread state.
  // We can check if there are any email accounts configured as a proxy.
  const emailConfigured = await prisma.gmailAccount.count({ where: { userId: user.id } }) > 0
    || await prisma.outlookAccount.count({ where: { userId: user.id } }) > 0;

  return NextResponse.json({
    messages: messagesUnread,
    email: 0, // Email unreads handled client-side
    emailConfigured,
    support: supportUnread,
  });
}
