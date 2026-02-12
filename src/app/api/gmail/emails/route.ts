import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getValidToken,
  listMessages,
  getMessageMetadata,
  getMessage,
  getHeader,
  getPlainBody,
} from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const messageId = req.nextUrl.searchParams.get("messageId");
  const query = req.nextUrl.searchParams.get("q") || undefined;
  const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let token: string;
  try {
    token = await getValidToken(accountId);
  } catch {
    return NextResponse.json({ error: "Failed to authenticate with Gmail. Try reconnecting." }, { status: 401 });
  }

  // Single message detail
  if (messageId) {
    try {
      const msg = await getMessage(token, messageId);
      return NextResponse.json({
        id: msg.id,
        threadId: msg.threadId,
        labelIds: msg.labelIds,
        from: getHeader(msg, "From"),
        to: getHeader(msg, "To"),
        subject: getHeader(msg, "Subject"),
        date: getHeader(msg, "Date"),
        snippet: msg.snippet,
        body: getPlainBody(msg),
        internalDate: msg.internalDate,
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });
    }
  }

  // List messages
  try {
    const list = await listMessages(token, query, 30, pageToken);

    if (!list.messages || list.messages.length === 0) {
      return NextResponse.json({ emails: [], nextPageToken: null });
    }

    // Fetch metadata for each message
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
        };
      })
    );

    return NextResponse.json({
      emails,
      nextPageToken: list.nextPageToken || null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
