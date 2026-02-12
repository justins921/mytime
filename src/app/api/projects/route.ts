import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const clientId = req.nextUrl.searchParams.get("clientId");
  const projects = await prisma.project.findMany({
    where: {
      archived: false,
      ...(clientId ? { clientId } : {}),
      client: { userId: user.id },
    },
    include: { client: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();

  // Verify the client belongs to the user
  const client = await prisma.client.findUnique({
    where: { id: body.clientId, userId: user.id },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

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
