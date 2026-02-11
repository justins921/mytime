import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "weekly"; // daily|weekly|monthly
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 });
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      startAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59"),
      },
      durationMinutes: { not: null },
    },
    include: { client: true, project: true, task: true },
    orderBy: { startAt: "asc" },
  });

  // Aggregate by client
  const clientTotals: Record<string, { name: string; minutes: number; color: string }> = {};
  const uc30Minutes: { uc30: number; nonUc30: number } = { uc30: 0, nonUc30: 0 };
  let supportMinutes = 0;

  for (const entry of entries) {
    const cid = entry.clientId;
    if (!clientTotals[cid]) {
      clientTotals[cid] = { name: entry.client.name, minutes: 0, color: entry.client.color };
    }
    clientTotals[cid].minutes += entry.durationMinutes ?? 0;

    // UC30 breakdown for Chandler
    if (entry.project?.tags?.includes("UC30")) {
      uc30Minutes.uc30 += entry.durationMinutes ?? 0;
    } else if (entry.client.name === "Chandler") {
      uc30Minutes.nonUc30 += entry.durationMinutes ?? 0;
    }

    // Support time
    if (entry.client.style === "Support") {
      supportMinutes += entry.durationMinutes ?? 0;
    }
  }

  // Build warnings
  const clients = await prisma.client.findMany({ where: { archived: false } });
  const warnings: string[] = [];

  for (const client of clients) {
    const total = clientTotals[client.id]?.minutes ?? 0;
    const hours = total / 60;

    if (period === "weekly" && hours > client.weeklyTargetHours) {
      warnings.push(`${client.name}: ${hours.toFixed(1)}h exceeds weekly target of ${client.weeklyTargetHours}h`);
    }

    // Monthly projection
    if (period === "weekly") {
      const projected = hours * 4.33;
      if (projected > client.monthlyCapHours) {
        warnings.push(`${client.name}: Projected ${projected.toFixed(1)}h/mo exceeds cap of ${client.monthlyCapHours}h`);
      }
    }
  }

  return NextResponse.json({
    period,
    startDate,
    endDate,
    clientTotals,
    uc30Breakdown: uc30Minutes,
    supportMinutes,
    warnings,
    entries: entries.map((e) => ({
      date: e.startAt.toISOString().split("T")[0],
      client: e.client.name,
      project: e.project?.name ?? "",
      task: e.task?.title ?? "",
      minutes: e.durationMinutes,
      notes: e.notes,
    })),
  });
}
