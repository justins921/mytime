import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const clientId = req.nextUrl.searchParams.get("clientId");
  const where: Record<string, unknown> = { userId: user.id };
  if (clientId) where.clientId = clientId;

  const notes = await prisma.note.findMany({
    where,
    include: { client: { select: { id: true, name: true, color: true } } },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const note = await prisma.note.create({
    data: {
      userId: user.id,
      title: body.title || "Untitled",
      content: body.content || "",
      clientId: body.clientId || null,
      pinned: body.pinned ?? false,
    },
    include: { client: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json(note, { status: 201 });
}
