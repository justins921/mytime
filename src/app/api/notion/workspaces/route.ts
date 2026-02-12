import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const workspaces = await prisma.notionWorkspace.findMany({
    include: { favoritePages: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(workspaces);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.notionWorkspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
