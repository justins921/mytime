import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const month = req.nextUrl.searchParams.get("month"); // YYYY-MM
  if (!month) {
    return NextResponse.json({ error: "month parameter required (YYYY-MM)" }, { status: 400 });
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const mon = parseInt(monthStr);
  const lastDay = new Date(year, mon, 0).getDate();

  const monthStart = new Date(`${month}-01T00:00:00`);
  const monthEnd = new Date(`${month}-${String(lastDay).padStart(2, "0")}T23:59:59`);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      startAt: { gte: monthStart, lte: monthEnd },
      endAt: { not: null },
      durationMinutes: { not: null },
    },
    select: {
      clientId: true,
      durationMinutes: true,
    },
  });

  const totals: Record<string, number> = {};
  for (const entry of entries) {
    if (!entry.durationMinutes) continue;
    totals[entry.clientId] = (totals[entry.clientId] || 0) + entry.durationMinutes / 60;
  }

  return NextResponse.json(totals);
}
