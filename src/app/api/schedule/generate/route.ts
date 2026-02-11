import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSchedule, generateWarnings } from "@/lib/scheduler";
import type { SchedulerInput, ClientConfig } from "@/lib/scheduler/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { weekDates, keepLocked, keepManual, generateFromNow } = body as {
    weekDates: string[];
    keepLocked?: boolean;
    keepManual?: boolean;
    generateFromNow?: boolean;
  };

  // Load settings (auto-create if missing)
  let settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }

  // Load clients with projects
  const clients = await prisma.client.findMany({
    where: { archived: false },
    include: { projects: { where: { archived: false } } },
  });

  // Parse settings
  const availability = JSON.parse(settings.availabilityJson);
  const fixedBreaks = JSON.parse(settings.fixedBreaksJson);
  const lunchReserve = JSON.parse(settings.lunchReserveJson);
  const nightWork = JSON.parse(settings.nightWorkJson);
  const deepWorkSplit = JSON.parse(settings.deepWorkSplitJson).splits || [];

  // Get existing blocks for the week
  const existingBlocks = await prisma.scheduleBlock.findMany({
    where: {
      date: { in: weekDates },
    },
  });

  // Determine which existing blocks to keep
  const blocksToKeep = existingBlocks.filter((b) => {
    if (keepLocked && b.locked) return true;
    if (keepManual && !b.generated) return true;
    return false;
  });

  // Delete non-kept blocks
  const keepIds = new Set(blocksToKeep.map((b) => b.id));
  const toDelete = existingBlocks.filter((b) => !keepIds.has(b.id));
  if (toDelete.length > 0) {
    await prisma.scheduleBlock.deleteMany({
      where: { id: { in: toDelete.map((b) => b.id) } },
    });
  }

  // Get current time in timezone
  const tz = settings.timezone || "America/Chicago";
  const now = new Date();
  const nowStr = now.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: tz });

  // Build scheduler input
  const clientConfigs: ClientConfig[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    weeklyTargetHours: c.weeklyTargetHours,
    monthlyCapHours: c.monthlyCapHours,
    priorityWeight: c.priorityWeight,
    style: c.style as "DeepWork" | "Support" | "Mixed",
    dailyTouch: c.dailyTouch,
    projects: c.projects.map((p) => ({
      id: p.id,
      name: p.name,
      tags: p.tags ? p.tags.split(",").map((t) => t.trim()) : [],
      weight: p.weight,
    })),
  }));

  const schedulerInput: SchedulerInput = {
    weekDates,
    availability,
    fixedBreaks,
    lunchReserve,
    nightWork,
    clients: clientConfigs,
    deepWorkSplit,
    supportSweepMinutes: settings.supportSweepMinutes,
    generateFromNow: generateFromNow ?? settings.generateFromNow,
    currentTime: nowStr,
    today: todayStr,
    lockedBlockIds: blocksToKeep.map((b) => b.id),
    existingBlocks: blocksToKeep.map((b) => ({
      id: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      clientId: b.clientId,
      projectId: b.projectId,
      title: b.title,
      type: b.type as "Support" | "DeepWork" | "Break" | "Admin" | "Lunch",
      locked: b.locked,
      generated: b.generated,
      notes: b.notes,
    })),
    uc30WeeklyHours: settings.uc30WeeklyHours,
  };

  // Generate schedule
  const generatedBlocks = generateSchedule(schedulerInput);

  // Filter out blocks that overlap with kept blocks
  const newBlocks = generatedBlocks.filter((gb) => {
    // Don't re-add blocks that are already kept
    return !blocksToKeep.some(
      (kb) =>
        kb.date === gb.date &&
        kb.startTime === gb.startTime &&
        kb.endTime === gb.endTime
    );
  });

  // Save new blocks to DB
  if (newBlocks.length > 0) {
    await prisma.$transaction(
      newBlocks.map((b) =>
        prisma.scheduleBlock.create({
          data: {
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            clientId: b.clientId,
            projectId: b.projectId,
            title: b.title,
            type: b.type,
            locked: b.locked,
            generated: true,
            notes: b.notes,
          },
        })
      )
    );
  }

  // Fetch all blocks for the week to return
  const allBlocks = await prisma.scheduleBlock.findMany({
    where: { date: { in: weekDates } },
    include: { client: true, project: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  // Generate warnings
  const warnings = generateWarnings(
    allBlocks.map((b) => ({
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      clientId: b.clientId,
      projectId: b.projectId,
      title: b.title,
      type: b.type as "Support" | "DeepWork" | "Break" | "Admin" | "Lunch",
      locked: b.locked,
      generated: b.generated,
      notes: b.notes,
    })),
    clientConfigs
  );

  return NextResponse.json({ blocks: allBlocks, warnings });
}
