import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id } = body;

  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const duration = (now.getTime() - entry.startAt.getTime()) / 60000;

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      endAt: now,
      durationMinutes: Math.round(duration * 10) / 10,
      notes: body.notes ?? entry.notes,
    },
    include: { client: true, project: true, task: true },
  });

  return NextResponse.json(updated);
}
