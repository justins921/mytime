import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

// GET: list all kanban cards, optionally filtered by accountId or status
export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const accountId = req.nextUrl.searchParams.get("accountId");
  const status = req.nextUrl.searchParams.get("status");
  const clientId = req.nextUrl.searchParams.get("clientId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { account: { userId: user.id } };
  if (accountId) where.accountId = accountId;
  if (status) where.status = status;
  if (clientId) {
    where.account = { ...where.account, clientId };
  }

  const cards = await prisma.emailCard.findMany({
    where,
    include: {
      account: {
        select: { id: true, email: true, clientId: true, client: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { receivedAt: "desc" }],
  });

  return NextResponse.json(cards);
}

// POST: create or update a kanban card for an email
export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { gmailMessageId, accountId, subject, fromAddress, snippet, receivedAt, status } = await req.json();

  if (!gmailMessageId || !accountId) {
    return NextResponse.json({ error: "gmailMessageId and accountId required" }, { status: 400 });
  }

  // Verify account belongs to user
  const account = await prisma.gmailAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const card = await prisma.emailCard.upsert({
    where: {
      gmailMessageId_accountId: { gmailMessageId, accountId },
    },
    update: {
      status: status || "Todo",
      ...(subject && { subject }),
      ...(fromAddress && { fromAddress }),
      ...(snippet && { snippet }),
    },
    create: {
      gmailMessageId,
      accountId,
      subject: subject || "",
      fromAddress: fromAddress || "",
      snippet: snippet || "",
      receivedAt: receivedAt ? new Date(receivedAt) : null,
      status: status || "Todo",
    },
    include: {
      account: {
        select: { id: true, email: true, clientId: true, client: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  return NextResponse.json(card);
}

// PATCH: update card status or sort order
export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id, status, sortOrder } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Verify card's account belongs to user
  const existing = await prisma.emailCard.findUnique({ where: { id }, include: { account: true } });
  if (!existing || existing.account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (status !== undefined) data.status = status;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const card = await prisma.emailCard.update({
    where: { id },
    data,
    include: {
      account: {
        select: { id: true, email: true, clientId: true, client: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  return NextResponse.json(card);
}

// DELETE: remove a card from the kanban board
export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await req.json();

  // Verify card's account belongs to user
  const existing = await prisma.emailCard.findUnique({ where: { id }, include: { account: true } });
  if (!existing || existing.account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.emailCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
