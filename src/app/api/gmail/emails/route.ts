import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getValidToken,
  listMessages,
  getMessageMetadata,
  getMessage,
  getHeader,
  getBody,
} from "@/lib/gmail";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const accountId = req.nextUrl.searchParams.get("accountId");
  const messageId = req.nextUrl.searchParams.get("messageId");
  const query = req.nextUrl.searchParams.get("q") || undefined;
  const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  // Single message detail
  if (messageId) {
    const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    let token: string;
    try {
      token = await getValidToken(accountId);
    } catch {
      return NextResponse.json({ error: "Failed to authenticate with Gmail. Try reconnecting." }, { status: 401 });
    }

    try {
      const msg = await getMessage(token, messageId);
      const { content, isHtml } = getBody(msg);
      return NextResponse.json({
        id: msg.id,
        threadId: msg.threadId,
        labelIds: msg.labelIds,
        from: getHeader(msg, "From"),
        to: getHeader(msg, "To"),
        subject: getHeader(msg, "Subject"),
        date: getHeader(msg, "Date"),
        snippet: msg.snippet,
        body: content,
        isHtml,
        internalDate: msg.internalDate,
        accountEmail: account.email,
        accountId: account.id,
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });
    }
  }

  // Support fetching from multiple accounts (comma-separated IDs)
  const accountIds = accountId.split(",").map((id) => id.trim()).filter(Boolean);

  try {
    const allEmails: {
      id: string;
      threadId: string;
      labelIds: string[];
      from: string;
      subject: string;
      date: string;
      snippet: string;
      internalDate: string;
      accountEmail: string;
      accountId: string;
    }[] = [];

    await Promise.all(
      accountIds.map(async (acctId) => {
        const account = await prisma.gmailAccount.findUnique({ where: { id: acctId } });
        if (!account || account.userId !== user.id) return;

        let token: string;
        try {
          token = await getValidToken(acctId);
        } catch {
          return; // Skip accounts that fail auth
        }

        const inboxQuery = query ? `in:inbox ${query}` : "in:inbox";
        const list = await listMessages(token, inboxQuery, 30, pageToken);
        if (!list.messages || list.messages.length === 0) return;

        const emails = await Promise.all(
          list.messages.map(async (m) => {
            const msg = await getMessageMetadata(token, m.id);
            return {
              id: msg.id,
              threadId: msg.threadId,
              labelIds: msg.labelIds || [],
              from: getHeader(msg, "From"),
              subject: getHeader(msg, "Subject"),
              date: getHeader(msg, "Date"),
              snippet: msg.snippet,
              internalDate: msg.internalDate,
              accountEmail: account.email,
              accountId: account.id,
            };
          })
        );

        allEmails.push(...emails);
      })
    );

    // Sort by internalDate descending (newest first)
    allEmails.sort((a, b) => {
      const dateA = parseInt(a.internalDate) || 0;
      const dateB = parseInt(b.internalDate) || 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      emails: allEmails,
      nextPageToken: null, // Pagination is per-account; omit for multi-account
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
