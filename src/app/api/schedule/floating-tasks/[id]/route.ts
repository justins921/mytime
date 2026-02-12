import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const body = await req.json();
  const task = await prisma.floatingTask.update({
    where: { id, userId: user.id },
    data: body,
    include: { client: true, project: true },
  });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  await prisma.floatingTask.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
