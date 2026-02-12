import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status"); // optional filter
  const where = status ? { status } : {};
  const tasks = await prisma.floatingTask.findMany({
    where,
    include: { client: true, project: true },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const task = await prisma.floatingTask.create({
    data: {
      title: body.title,
      estimateMinutes: body.estimateMinutes ?? 60,
      clientId: body.clientId || null,
      projectId: body.projectId || null,
      dueDate: body.dueDate || null,
      priority: body.priority || "P2",
      mustSchedule: body.mustSchedule ?? true,
      notes: body.notes || "",
    },
    include: { client: true, project: true },
  });
  return NextResponse.json(task, { status: 201 });
}
