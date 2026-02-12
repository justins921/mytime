import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  // Return just the set of imported ClickUp task IDs
  const clickupIds = req.nextUrl.searchParams.get("clickupIds");
  if (clickupIds === "true") {
    const tasks = await prisma.task.findMany({
      where: { clickupTaskId: { not: null }, project: { client: { userId: user.id } } },
      select: { clickupTaskId: true },
    });
    return NextResponse.json(tasks.map((t) => t.clickupTaskId));
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  const clientId = req.nextUrl.searchParams.get("clientId");
  const status = req.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {
    project: { client: { userId: user.id } },
  };
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (clientId) where.project = { clientId, client: { userId: user.id } };

  const tasks = await prisma.task.findMany({
    where,
    include: { project: { include: { client: true } } },
    orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();

  // Verify the project belongs to the user through client
  const project = await prisma.project.findFirst({
    where: { id: body.projectId, client: { userId: user.id } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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
