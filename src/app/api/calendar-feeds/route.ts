import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const feeds = await prisma.calendarFeed.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(feeds);
}

export async function POST(req: NextRequest) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const body = await req.json();
  const feed = await prisma.calendarFeed.create({
    data: {
      userId: user.id,
      name: body.name,
      url: body.url,
      color: body.color || "#8b5cf6",
      enabled: body.enabled ?? true,
    },
  });
  return NextResponse.json(feed, { status: 201 });
}
