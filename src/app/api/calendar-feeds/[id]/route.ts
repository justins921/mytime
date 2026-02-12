import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  const body = await req.json();
  const feed = await prisma.calendarFeed.update({
    where: { id, userId: user.id },
    data: body,
  });
  return NextResponse.json(feed);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;
  await prisma.calendarFeed.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
