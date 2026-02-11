import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  const projects = await prisma.project.findMany({
    where: {
      archived: false,
      ...(clientId ? { clientId } : {}),
    },
    include: { client: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      clientId: body.clientId,
      name: body.name,
      tags: body.tags ?? "",
      weight: body.weight ?? 1.0,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
