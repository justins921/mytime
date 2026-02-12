import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const feed = await prisma.calendarFeed.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(feed);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.calendarFeed.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
