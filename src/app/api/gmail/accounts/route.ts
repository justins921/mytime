import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const accounts = await prisma.gmailAccount.findMany({
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
  const { id, clientId } = await req.json();

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
  const { id } = await req.json();
  await prisma.gmailAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
