import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const workspaces = await prisma.slackWorkspace.findMany({
    include: { client: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    workspaces.map((w) => ({
      id: w.id,
      teamId: w.teamId,
      teamName: w.teamName,
      clientId: w.clientId,
      client: w.client,
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const { id, clientId } = await req.json();

  const workspace = await prisma.slackWorkspace.update({
    where: { id },
    data: { clientId: clientId || null },
    include: { client: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({
    id: workspace.id,
    teamId: workspace.teamId,
    teamName: workspace.teamName,
    clientId: workspace.clientId,
    client: workspace.client,
  });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.slackWorkspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
