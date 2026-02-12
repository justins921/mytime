import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const body = await req.json();
  const block = await prisma.scheduleBlock.update({
    where: { id, userId: user.id },
    data: body,
  });
  return NextResponse.json(block);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  await prisma.scheduleBlock.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
