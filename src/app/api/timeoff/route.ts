import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const where: { userId: string; startDate?: { lte: string }; endDate?: { gte: string } } = { userId: user.id };

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
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { startDate, endDate, title, type, notes } = body;

  if (!startDate || !endDate || !title) {
    return NextResponse.json({ error: "startDate, endDate, and title required" }, { status: 400 });
  }

  const timeOff = await prisma.timeOff.create({
    data: {
      userId: user.id,
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
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const timeOff = await prisma.timeOff.update({
    where: { id, userId: user.id },
    data: updates,
  });

  return NextResponse.json(timeOff);
}

export async function DELETE(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.timeOff.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
