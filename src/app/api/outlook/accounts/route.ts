import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const accounts = await prisma.outlookAccount.findMany({
    where: { userId: user.id },
    select: { id: true, email: true, clientId: true, client: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function PATCH(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id, clientId } = await req.json();

  const account = await prisma.outlookAccount.findUnique({ where: { id } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.outlookAccount.update({
    where: { id },
    data: { clientId: clientId || null },
    include: { client: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await req.json();

  const account = await prisma.outlookAccount.findUnique({ where: { id } });
  if (!account || account.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.outlookAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
