import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const favorites = await prisma.notionFavoritePage.findMany({
    include: { workspace: { select: { id: true, workspaceName: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
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
