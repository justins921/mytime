import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const active = req.nextUrl.searchParams.get("active");

  if (active === "true") {
    // Get the currently running timer (no endAt)
    const entry = await prisma.timeEntry.findFirst({
      where: { endAt: null },
      include: { client: true, project: true, task: true, scheduleBlock: true },
      orderBy: { startAt: "desc" },
    });
    return NextResponse.json(entry);
  }

  const clientId = req.nextUrl.searchParams.get("clientId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (startDate && endDate) {
    where.startAt = {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59"),
    };
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: { client: true, project: true, task: true },
    orderBy: { startAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Manual entry: explicit startAt + endAt
  if (body.manual && body.startAt && body.endAt) {
    const start = new Date(body.startAt);
    const end = new Date(body.endAt);
    const duration = (end.getTime() - start.getTime()) / 60000;
    const entry = await prisma.timeEntry.create({
      data: {
        startAt: start,
        endAt: end,
        durationMinutes: Math.round(duration * 10) / 10,
        clientId: body.clientId,
        projectId: body.projectId || null,
        taskId: body.taskId || null,
        scheduleBlockId: body.scheduleBlockId || null,
        notes: body.notes ?? "",
      },
      include: { client: true, project: true, task: true },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  // Check for existing active timer
  const active = await prisma.timeEntry.findFirst({
    where: { endAt: null },
  });

  if (active) {
    // Stop the active timer first
    const now = new Date();
    const duration = (now.getTime() - active.startAt.getTime()) / 60000;
    await prisma.timeEntry.update({
      where: { id: active.id },
      data: { endAt: now, durationMinutes: Math.round(duration * 10) / 10 },
    });
  }

  // Start new timer
  const entry = await prisma.timeEntry.create({
    data: {
      startAt: new Date(),
      clientId: body.clientId,
      projectId: body.projectId || null,
      taskId: body.taskId || null,
      scheduleBlockId: body.scheduleBlockId || null,
      notes: body.notes ?? "",
    },
    include: { client: true, project: true, task: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
