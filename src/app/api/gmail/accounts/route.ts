import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const accounts = await prisma.gmailAccount.findMany({
    where: { userId: user.id },
    include: { client: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    accounts.map((a) => ({
      id: a.id,
      email: a.email,
      clientId: a.clientId,
      client: a.client,
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id, clientId } = await req.json();

  // Verify ownership
  const existing = await prisma.gmailAccount.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const account = await prisma.gmailAccount.update({
    where: { id },
    data: { clientId: clientId || null },
    include: { client: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({
    id: account.id,
    email: account.email,
    clientId: account.clientId,
    client: account.client,
  });
}

export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await req.json();

  // Verify ownership
  const existing = await prisma.gmailAccount.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.gmailAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
