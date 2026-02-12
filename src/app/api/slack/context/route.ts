import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const currentTime = format(now, "HH:mm");

  // 1. Check for an active timer first
  const activeTimer = await prisma.timeEntry.findFirst({
    where: { endAt: null, userId: user.id },
    include: { client: { select: { id: true, name: true, color: true } } },
  });

  if (activeTimer) {
    return NextResponse.json({
      clientId: activeTimer.clientId,
      client: activeTimer.client,
      source: "timer",
    });
  }

  // 2. Check current schedule block
  const currentBlock = await prisma.scheduleBlock.findFirst({
    where: {
      userId: user.id,
      date: today,
      startTime: { lte: currentTime },
      endTime: { gt: currentTime },
      clientId: { not: null },
    },
    include: { client: { select: { id: true, name: true, color: true } } },
    orderBy: { startTime: "asc" },
  });

  if (currentBlock?.client) {
    return NextResponse.json({
      clientId: currentBlock.clientId,
      client: currentBlock.client,
      source: "schedule",
    });
  }

  // 3. No active context
  return NextResponse.json({ clientId: null, client: null, source: "none" });
}
