import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const where: { startDate?: { lte: string }; endDate?: { gte: string } } = {};

  // Filter by date range overlap: time-off that overlaps with [startDate, endDate]
  if (endDate) where.startDate = { lte: endDate };
  if (startDate) where.endDate = { gte: startDate };

  const timeOffs = await prisma.timeOff.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(timeOffs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { startDate, endDate, title, type, notes } = body;

  if (!startDate || !endDate || !title) {
    return NextResponse.json({ error: "startDate, endDate, and title required" }, { status: 400 });
  }

  const timeOff = await prisma.timeOff.create({
    data: {
      startDate,
      endDate,
      title,
      type: type || "Vacation",
      notes: notes || "",
    },
  });

  return NextResponse.json(timeOff);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const timeOff = await prisma.timeOff.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(timeOff);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.timeOff.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
