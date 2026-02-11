import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
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

  // Build CSV
  const headers = "Date,Client,Project,Task,Minutes,Notes\n";
  const rows = entries
    .map((e) => {
      const date = e.startAt.toISOString().split("T")[0];
      const client = e.client.name;
      const project = e.project?.name ?? "";
      const task = e.task?.title ?? "";
      const minutes = e.durationMinutes ?? 0;
      const notes = (e.notes || "").replace(/"/g, '""');
      return `${date},"${client}","${project}","${task}",${minutes},"${notes}"`;
    })
    .join("\n");

  const csv = headers + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="time-report-${startDate}-to-${endDate}.csv"`,
    },
  });
}
