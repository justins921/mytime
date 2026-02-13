import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getValidOutlookToken, listMessages, getMessage, archiveMessage } from "@/lib/outlook";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const accountId = req.nextUrl.searchParams.get("accountId");
  const messageId = req.nextUrl.searchParams.get("messageId");
  const query = req.nextUrl.searchParams.get("q") || undefined;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const account = await prisma.outlookAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const token = await getValidOutlookToken(accountId);

    // Fetch individual message if messageId is provided
    if (messageId) {
      const msg = await getMessage(token, messageId);
      return NextResponse.json(msg);
    }

    const result = await listMessages(token, query);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/outlook/emails — actions on messages (archive, etc.)
 */
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { accountId, messageId, action } = await req.json();

  if (!accountId || !messageId || !action) {
    return NextResponse.json({ error: "accountId, messageId, and action are required" }, { status: 400 });
  }

  const account = await prisma.outlookAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const token = await getValidOutlookToken(accountId);

    if (action === "archive") {
      await archiveMessage(token, messageId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to perform action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
