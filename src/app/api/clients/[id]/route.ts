import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id, userId: user.id },
    include: { projects: { where: { archived: false }, include: { tasks: true } } },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const body = await req.json();
  const client = await prisma.client.update({
    where: { id, userId: user.id },
    data: body,
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  await prisma.client.update({
    where: { id, userId: user.id },
    data: { archived: true },
  });
  return NextResponse.json({ ok: true });
}
