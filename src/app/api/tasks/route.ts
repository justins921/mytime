import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const clientId = req.nextUrl.searchParams.get("clientId");
  const status = req.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (clientId) where.project = { clientId };

  const tasks = await prisma.task.findMany({
    where,
    include: { project: { include: { client: true } } },
    orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      projectId: body.projectId,
      title: body.title,
      description: body.description ?? "",
      priority: body.priority ?? "P2",
      estimateMinutes: body.estimateMinutes ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: body.status ?? "Backlog",
      url: body.url ?? "",
      tags: body.tags ?? "",
    },
  });
  return NextResponse.json(task, { status: 201 });
}
