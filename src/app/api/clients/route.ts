import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const clients = await prisma.client.findMany({
    where: { archived: false, userId: user.id },
    include: { projects: { where: { archived: false } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: body.name,
      retainerMonthly: body.isPersonal ? 0 : (body.retainerMonthly ?? 2000),
      baselineRateHourly: body.isPersonal ? 0 : (body.baselineRateHourly ?? 50),
      weeklyTargetHours: body.isPersonal ? 0 : (body.weeklyTargetHours ?? 10),
      monthlyCapHours: body.isPersonal ? 0 : (body.monthlyCapHours ?? (body.retainerMonthly ?? 2000) / (body.baselineRateHourly ?? 50)),
      priorityWeight: body.priorityWeight ?? 1.0,
      style: body.isPersonal ? "Personal" : (body.style ?? "DeepWork"),
      dailyTouch: body.dailyTouch ?? false,
      isPersonal: body.isPersonal ?? false,
      color: body.color ?? "#3b82f6",
    },
  });
  return NextResponse.json(client, { status: 201 });
}
