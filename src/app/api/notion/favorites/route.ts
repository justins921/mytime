import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const favorites = await prisma.notionFavoritePage.findMany({
    where: { workspace: { userId: user.id } },
    include: { workspace: { select: { id: true, workspaceName: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();

  // Verify workspace belongs to user
  const workspace = await prisma.notionWorkspace.findUnique({ where: { id: body.workspaceId } });
  if (!workspace || workspace.userId !== user.id) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const favorite = await prisma.notionFavoritePage.upsert({
    where: {
      pageId_workspaceId: {
        pageId: body.pageId,
        workspaceId: body.workspaceId,
      },
    },
    create: {
      pageId: body.pageId,
      title: body.title || "Untitled",
      icon: body.icon || "",
      workspaceId: body.workspaceId,
    },
    update: {
      title: body.title || "Untitled",
      icon: body.icon || "",
    },
    include: { workspace: { select: { id: true, workspaceName: true } } },
  });
  return NextResponse.json(favorite, { status: 201 });
}
