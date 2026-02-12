import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const workspaces = await prisma.slackWorkspace.findMany({
    where: { userId: user.id },
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
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id, clientId } = await req.json();

  // Verify ownership
  const existing = await prisma.slackWorkspace.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await req.json();

  // Verify ownership
  const existing = await prisma.slackWorkspace.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.slackWorkspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
