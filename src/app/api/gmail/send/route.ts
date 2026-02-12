import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getValidToken, sendEmail } from "@/lib/gmail";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { accountId, to, subject, body, threadId, inReplyTo, references } = await req.json();

  if (!accountId || !to || !body?.trim()) {
    return NextResponse.json(
      { error: "accountId, to, and body required" },
      { status: 400 }
    );
  }

  const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let token: string;
  try {
    token = await getValidToken(accountId);
  } catch {
    return NextResponse.json({ error: "Failed to authenticate with Gmail" }, { status: 401 });
  }

  try {
    const result = await sendEmail(
      token,
      to,
      subject || "(no subject)",
      body.trim(),
      threadId,
      inReplyTo,
      references
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message || "Send failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, messageId: result.id });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
