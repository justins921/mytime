import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getValidToken, modifyLabels } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  const { accountId, messageId } = await req.json();

  if (!accountId || !messageId) {
    return NextResponse.json({ error: "accountId and messageId required" }, { status: 400 });
  }

  const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let token: string;
  try {
    token = await getValidToken(accountId);
  } catch {
    return NextResponse.json({ error: "Failed to authenticate with Gmail" }, { status: 401 });
  }

  try {
    await modifyLabels(token, messageId, [], ["INBOX"]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to archive message" }, { status: 500 });
  }
}
