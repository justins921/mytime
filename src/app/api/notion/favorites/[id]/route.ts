import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const { id } = await params;

  // Verify favorite's workspace belongs to user
  const favorite = await prisma.notionFavoritePage.findUnique({
    where: { id },
    include: { workspace: true },
  });
  if (!favorite || favorite.workspace.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notionFavoritePage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
