import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id, userId: user.id },
    include: { client: { select: { id: true, name: true, color: true } } },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const body = await req.json();
  const note = await prisma.note.update({
    where: { id, userId: user.id },
    data: body,
    include: { client: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json(note);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  await prisma.note.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
