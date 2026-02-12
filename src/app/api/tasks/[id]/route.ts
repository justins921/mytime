import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;

  // Verify task belongs to user through project->client
  const existing = await prisma.task.findFirst({
    where: { id, project: { client: { userId: user.id } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.dueDate) body.dueDate = new Date(body.dueDate);
  const task = await prisma.task.update({ where: { id }, data: body });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;

  // Verify task belongs to user through project->client
  const existing = await prisma.task.findFirst({
    where: { id, project: { client: { userId: user.id } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
