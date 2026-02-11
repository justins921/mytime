import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const clients = await prisma.client.findMany({
    where: { archived: false },
    include: { projects: { where: { archived: false } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      name: body.name,
      retainerMonthly: body.retainerMonthly ?? 2000,
      baselineRateHourly: body.baselineRateHourly ?? 50,
      weeklyTargetHours: body.weeklyTargetHours ?? 10,
      monthlyCapHours: body.monthlyCapHours ?? (body.retainerMonthly ?? 2000) / (body.baselineRateHourly ?? 50),
      priorityWeight: body.priorityWeight ?? 1.0,
      style: body.style ?? "DeepWork",
      dailyTouch: body.dailyTouch ?? false,
      color: body.color ?? "#3b82f6",
    },
  });
  return NextResponse.json(client, { status: 201 });
}
