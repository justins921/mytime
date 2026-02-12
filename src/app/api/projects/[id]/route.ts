import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;

  // Verify project belongs to user through client
  const existing = await prisma.project.findFirst({
    where: { id, client: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const project = await prisma.project.update({ where: { id }, data: body });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;

  // Verify project belongs to user through client
  const existing = await prisma.project.findFirst({
    where: { id, client: { userId: user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.update({ where: { id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
