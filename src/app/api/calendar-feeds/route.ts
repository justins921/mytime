import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const feeds = await prisma.calendarFeed.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(feeds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const feed = await prisma.calendarFeed.create({
    data: {
      name: body.name,
      url: body.url,
      color: body.color || "#8b5cf6",
      enabled: body.enabled ?? true,
    },
  });
  return NextResponse.json(feed, { status: 201 });
}
