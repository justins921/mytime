import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const weekStart = req.nextUrl.searchParams.get("weekStart");
  const weekEnd = req.nextUrl.searchParams.get("weekEnd");

  const where: Record<string, unknown> = { userId: user.id };
  if (weekStart && weekEnd) {
    where.date = { gte: weekStart, lte: weekEnd };
  }

  const blocks = await prisma.scheduleBlock.findMany({
    where,
    include: { client: true, project: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();

  // If body is an array, bulk create (from schedule generator)
  if (Array.isArray(body)) {
    const blocks = await prisma.$transaction(
      body.map((b: Record<string, unknown>) =>
        prisma.scheduleBlock.create({
          data: {
            userId: user.id,
            date: b.date as string,
            startTime: b.startTime as string,
            endTime: b.endTime as string,
            clientId: (b.clientId as string) || null,
            projectId: (b.projectId as string) || null,
            title: b.title as string,
            type: b.type as string,
            locked: (b.locked as boolean) ?? false,
            generated: (b.generated as boolean) ?? true,
            notes: (b.notes as string) ?? "",
          },
        })
      )
    );
    return NextResponse.json(blocks, { status: 201 });
  }

  // Single block create
  const block = await prisma.scheduleBlock.create({
    data: {
      userId: user.id,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      clientId: body.clientId || null,
      projectId: body.projectId || null,
      title: body.title,
      type: body.type,
      locked: body.locked ?? false,
      generated: body.generated ?? false,
      notes: body.notes ?? "",
    },
  });
  return NextResponse.json(block, { status: 201 });
}
