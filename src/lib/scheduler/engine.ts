import { timeToMinutes, minutesToTime } from "@/lib/utils";
import type {
  SchedulerInput,
  GeneratedBlock,
  ClientConfig,
  BreakConfig,
  FloatingTaskConfig,
  ExternalEvent,
} from "./types";

interface TimeSlot {
  start: number; // minutes from midnight
  end: number;
}

/**
 * Rule-based schedule generator.
 * Produces schedule blocks for a work week respecting all constraints.
 */
export function generateSchedule(input: SchedulerInput): GeneratedBlock[] {
  const {
    weekDates,
    availability,
    fixedBreaks,
    lunchReserve,
    nightWork,
    clients,
    deepWorkSplit,
    supportSweepMinutes,
    generateFromNow,
    currentTime,
    today,
    uc30WeeklyHours,
    monthlyHoursUsed,
    floatingTasks,
    externalEvents,
  } = input;

  const allBlocks: GeneratedBlock[] = [];

  // Preserve locked/manual existing blocks
  const lockedBlocks = (input.existingBlocks || []).filter((b) => b.locked);

  // Identify support client (style === "Support")
  const supportClient = clients.find((c) => c.style === "Support");

  // Deep work clients (excluding support)
  const deepWorkClients = clients.filter((c) => c.style !== "Support");

  // Compute deep work total hours available per week
  // We'll compute per-day then allocate
  const dayKeys = ["mon", "tue", "wed", "thu", "fri"];

  // Calculate effective weekly target capped by remaining monthly capacity
  const effectiveWeeklyTarget: Record<string, number> = {};
  for (const client of clients) {
    const usedThisMonth = monthlyHoursUsed[client.id] || 0;
    const remainingMonthly = Math.max(0, client.monthlyCapHours - usedThisMonth);
    effectiveWeeklyTarget[client.id] = Math.min(client.weeklyTargetHours, remainingMonthly);
  }

  // Track allocated hours per client (within this week's generation)
  const clientAllocated: Record<string, number> = {};
  clients.forEach((c) => (clientAllocated[c.id] = 0));

  // Track daily touch fulfillment
  const dailyTouchFulfilled: Record<string, Set<string>> = {};
  clients.filter((c) => c.dailyTouch).forEach((c) => {
    dailyTouchFulfilled[c.id] = new Set();
  });

  for (let dayIdx = 0; dayIdx < weekDates.length; dayIdx++) {
    const dateStr = weekDates[dayIdx];
    const dayKey = dayKeys[dayIdx];
    const avail = availability[dayKey];

    if (!avail || !avail.enabled) continue;

    // Gather external calendar events for this day as extra breaks
    const dayExternalEvents = (externalEvents || []).filter((e) => e.date === dateStr);
    const allBreaks = [
      ...fixedBreaks,
      ...dayExternalEvents.map((e) => ({
        start: e.startTime,
        end: e.endTime,
        title: e.title,
        locked: false,
      })),
    ];

    // Compute available slots for this day (external events carved out like breaks)
    const daySlots = computeAvailableSlots(
      avail.start,
      avail.end,
      allBreaks,
      lunchReserve,
      nightWork[dayKey],
      generateFromNow && dateStr === today ? currentTime : undefined
    );

    // Add external calendar event blocks (for display)
    for (const ext of dayExternalEvents) {
      const extStart = timeToMinutes(ext.startTime);
      const extEnd = timeToMinutes(ext.endTime);

      if (generateFromNow && dateStr === today && currentTime) {
        const nowMins = timeToMinutes(currentTime);
        if (extEnd <= nowMins) continue;
      }

      if (extStart >= timeToMinutes(avail.start) && extEnd <= timeToMinutes(avail.end)) {
        allBlocks.push({
          date: dateStr,
          startTime: ext.startTime,
          endTime: ext.endTime,
          clientId: null,
          projectId: null,
          title: ext.title,
          type: "External",
          locked: false,
          generated: true,
          notes: "Calendar event",
        });
      }
    }

    // Add fixed break blocks
    for (const brk of fixedBreaks) {
      const brkStart = timeToMinutes(brk.start);
      const brkEnd = timeToMinutes(brk.end);

      // Skip if break is before "now" on today with generateFromNow
      if (generateFromNow && dateStr === today && currentTime) {
        const nowMins = timeToMinutes(currentTime);
        if (brkEnd <= nowMins) continue;
      }

      if (brkStart >= timeToMinutes(avail.start) && brkEnd <= timeToMinutes(avail.end)) {
        allBlocks.push({
          date: dateStr,
          startTime: brk.start,
          endTime: brk.end,
          clientId: null,
          projectId: null,
          title: brk.title,
          type: "Break",
          locked: brk.locked,
          generated: true,
          notes: "",
        });
      }
    }

    // Add lunch reserve
    if (lunchReserve) {
      const lStart = timeToMinutes(lunchReserve.start);
      const lEnd = timeToMinutes(lunchReserve.end);

      if (generateFromNow && dateStr === today && currentTime) {
        const nowMins = timeToMinutes(currentTime);
        if (lEnd > nowMins) {
          allBlocks.push({
            date: dateStr,
            startTime: lunchReserve.start,
            endTime: lunchReserve.end,
            clientId: null,
            projectId: null,
            title: lunchReserve.title || "Lunch",
            type: "Lunch",
            locked: false,
            generated: true,
            notes: "",
          });
        }
      } else {
        allBlocks.push({
          date: dateStr,
          startTime: lunchReserve.start,
          endTime: lunchReserve.end,
          clientId: null,
          projectId: null,
          title: lunchReserve.title || "Lunch",
          type: "Lunch",
          locked: false,
          generated: true,
          notes: "",
        });
      }
    }

    // Re-insert any locked existing blocks for this day
    const dayLockedBlocks = lockedBlocks.filter((b) => b.date === dateStr);
    for (const lb of dayLockedBlocks) {
      allBlocks.push(lb);
      if (lb.clientId) {
        const mins = (timeToMinutes(lb.endTime) - timeToMinutes(lb.startTime)) / 60;
        clientAllocated[lb.clientId] = (clientAllocated[lb.clientId] || 0) + mins;
      }
    }

    if (daySlots.length === 0) continue;

    // === ALLOCATION STRATEGY ===
    // 1. Bookend support sweeps (start of day & end of day) for support client
    // 2. Fill deep work blocks based on split weights
    // 3. Add admin/wrap block near end

    let remainingSlots = [...daySlots];

    // 1. Support sweep at START of day
    if (supportClient && remainingSlots.length > 0) {
      const firstSlot = remainingSlots[0];
      const supportRemaining = Math.max(0, (effectiveWeeklyTarget[supportClient.id] - clientAllocated[supportClient.id]) * 60);
      const sweepDuration = Math.min(supportSweepMinutes, firstSlot.end - firstSlot.start, supportRemaining);
      if (sweepDuration >= 15) {
        const defaultProject = supportClient.projects[0];
        allBlocks.push({
          date: dateStr,
          startTime: minutesToTime(firstSlot.start),
          endTime: minutesToTime(firstSlot.start + sweepDuration),
          clientId: supportClient.id,
          projectId: defaultProject?.id || null,
          title: `${supportClient.name} Support Sweep #1`,
          type: "Support",
          locked: false,
          generated: true,
          notes: "",
        });
        clientAllocated[supportClient.id] += sweepDuration / 60;

        // Shrink or remove first slot
        if (firstSlot.start + sweepDuration >= firstSlot.end) {
          remainingSlots.shift();
        } else {
          remainingSlots[0] = { start: firstSlot.start + sweepDuration, end: firstSlot.end };
        }
      }
    }

    // Place floating tasks (P1 first, then by due date urgency)
    if (floatingTasks && floatingTasks.length > 0) {
      // Sort: P1 before P2 before P3, then by due date (earlier = more urgent), then mustSchedule first
      const pendingTasks = [...floatingTasks].filter((t) => {
        // Only place tasks not yet placed in earlier days
        return !allBlocks.some((b) => b.floatingTaskId === t.id);
      });

      // Prefer placing tasks on/before their due date
      const tasksForToday = pendingTasks.filter((t) => {
        if (!t.dueDate) return true; // no due date = any day is fine
        if (t.dueDate === dateStr) return true; // due today
        if (t.dueDate < dateStr) return true; // overdue
        // Not due yet — only place if we're running out of days
        const daysUntilDue = weekDates.indexOf(t.dueDate) - dayIdx;
        return daysUntilDue <= 1; // place if due tomorrow or sooner
      });

      tasksForToday.sort((a, b) => {
        // Priority first (P1 < P2 < P3)
        if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
        // Must-schedule before optional
        if (a.mustSchedule !== b.mustSchedule) return a.mustSchedule ? -1 : 1;
        // Earlier due date first
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });

      for (const task of tasksForToday) {
        let minutesLeft = task.estimateMinutes;

        for (let si = 0; si < remainingSlots.length && minutesLeft > 0; si++) {
          const slot = remainingSlots[si];
          const available = slot.end - slot.start;
          if (available < 15) continue;

          const blockDuration = Math.min(minutesLeft, available);
          allBlocks.push({
            date: dateStr,
            startTime: minutesToTime(slot.start),
            endTime: minutesToTime(slot.start + blockDuration),
            clientId: task.clientId,
            projectId: task.projectId,
            title: task.title,
            type: "Task",
            locked: false,
            generated: true,
            notes: "",
            floatingTaskId: task.id,
          });

          // Count toward client allocation if applicable
          if (task.clientId && clientAllocated[task.clientId] !== undefined) {
            clientAllocated[task.clientId] += blockDuration / 60;
          }

          minutesLeft -= blockDuration;
          slot.start += blockDuration;
        }
      }

      // Clean up empty slots after task placement
      remainingSlots = remainingSlots.filter((s) => s.end - s.start >= 15);
    }

    // Reserve end-of-day support sweep and admin time
    let endSweepSlot: TimeSlot | null = null;
    let adminSlot: TimeSlot | null = null;

    if (remainingSlots.length > 0) {
      const lastSlot = remainingSlots[remainingSlots.length - 1];
      const totalEnd = lastSlot.end;

      // Support sweep at end (30 min)
      if (supportClient) {
        const supportRemainingEnd = Math.max(0, (effectiveWeeklyTarget[supportClient.id] - clientAllocated[supportClient.id]) * 60);
        const sweepDuration = Math.min(supportSweepMinutes, lastSlot.end - lastSlot.start, supportRemainingEnd);
        if (sweepDuration >= 15) {
          endSweepSlot = { start: totalEnd - sweepDuration, end: totalEnd };
          lastSlot.end = totalEnd - sweepDuration;

          // Admin block before end sweep (15 min)
          if (lastSlot.end - lastSlot.start >= 15) {
            adminSlot = { start: lastSlot.end - 15, end: lastSlot.end };
            lastSlot.end -= 15;
          }
        }
      }

      // Clean up empty slots
      remainingSlots = remainingSlots.filter((s) => s.end - s.start >= 15);
    }

    // 2. Fill deep work blocks
    // Calculate how much each deep work client needs today
    const workingDaysLeft = weekDates.length - dayIdx;
    const deepWorkAllocations: { client: ClientConfig; minutesNeeded: number }[] = [];

    for (const client of deepWorkClients) {
      const hoursAllocatedSoFar = clientAllocated[client.id] || 0;
      const hoursRemaining = Math.max(0, effectiveWeeklyTarget[client.id] - hoursAllocatedSoFar);
      const dailyShare = hoursRemaining / workingDaysLeft;
      deepWorkAllocations.push({
        client,
        minutesNeeded: Math.round(dailyShare * 60),
      });
    }

    // Sort by priority weight descending (higher priority first)
    deepWorkAllocations.sort((a, b) => b.client.priorityWeight - a.client.priorityWeight);

    // Assign blocks from remaining slots, split by project
    for (const alloc of deepWorkAllocations) {
      if (alloc.minutesNeeded <= 0) continue;

      // Split time across projects by weight
      const projectAllocations = splitByProject(alloc.client, alloc.minutesNeeded, uc30WeeklyHours, clientAllocated[alloc.client.id] || 0);

      for (const pa of projectAllocations) {
        let minutesLeft = pa.minutes;

        for (let si = 0; si < remainingSlots.length && minutesLeft > 0; si++) {
          const slot = remainingSlots[si];
          const available = slot.end - slot.start;
          if (available < 15) continue;

          const blockDuration = Math.min(minutesLeft, available);
          allBlocks.push({
            date: dateStr,
            startTime: minutesToTime(slot.start),
            endTime: minutesToTime(slot.start + blockDuration),
            clientId: alloc.client.id,
            projectId: pa.projectId,
            title: pa.title,
            type: "DeepWork",
            locked: false,
            generated: true,
            notes: "",
          });
          clientAllocated[alloc.client.id] += blockDuration / 60;
          minutesLeft -= blockDuration;

          // Mark daily touch
          if (dailyTouchFulfilled[alloc.client.id]) {
            dailyTouchFulfilled[alloc.client.id].add(dateStr);
          }

          // Shrink slot
          slot.start += blockDuration;
        }
      }
    }

    // Clean up empty slots
    remainingSlots = remainingSlots.filter((s) => s.end - s.start >= 15);

    // Ensure daily touch clients have at least one block
    for (const client of clients.filter((c) => c.dailyTouch)) {
      if (dailyTouchFulfilled[client.id]?.has(dateStr)) continue;

      // Grab some time from first remaining slot
      if (remainingSlots.length > 0) {
        const slot = remainingSlots[0];
        const blockDuration = Math.min(30, slot.end - slot.start);
        if (blockDuration >= 15) {
          const project = pickProject(client, uc30WeeklyHours, clientAllocated[client.id] || 0);
          allBlocks.push({
            date: dateStr,
            startTime: minutesToTime(slot.start),
            endTime: minutesToTime(slot.start + blockDuration),
            clientId: client.id,
            projectId: project?.id || null,
            title: `${client.name} Daily Touch`,
            type: "DeepWork",
            locked: false,
            generated: true,
            notes: "",
          });
          clientAllocated[client.id] += blockDuration / 60;
          dailyTouchFulfilled[client.id].add(dateStr);
          slot.start += blockDuration;
        }
      }
    }

    // 3. Admin block
    if (adminSlot) {
      allBlocks.push({
        date: dateStr,
        startTime: minutesToTime(adminSlot.start),
        endTime: minutesToTime(adminSlot.end),
        clientId: null,
        projectId: null,
        title: "Wrap/Admin",
        type: "Admin",
        locked: false,
        generated: true,
        notes: "",
      });
    }

    // 4. End-of-day support sweep
    if (endSweepSlot && supportClient) {
      const defaultProject = supportClient.projects[0];
      allBlocks.push({
        date: dateStr,
        startTime: minutesToTime(endSweepSlot.start),
        endTime: minutesToTime(endSweepSlot.end),
        clientId: supportClient.id,
        projectId: defaultProject?.id || null,
        title: `${supportClient.name} Support Sweep #2`,
        type: "Support",
        locked: false,
        generated: true,
        notes: "",
      });
      clientAllocated[supportClient.id] += (endSweepSlot.end - endSweepSlot.start) / 60;
    }

    // Add night work blocks if enabled
    if (nightWork[dayKey]?.enabled) {
      const nw = nightWork[dayKey];
      const nightSlot: TimeSlot = {
        start: timeToMinutes(nw.start),
        end: timeToMinutes(nw.end),
      };

      // Assign night block to highest-priority client with remaining hours
      const neediest = deepWorkClients
        .map((c) => ({
          client: c,
          remaining: effectiveWeeklyTarget[c.id] - (clientAllocated[c.id] || 0),
        }))
        .filter((x) => x.remaining > 0)
        .sort((a, b) => b.client.priorityWeight - a.client.priorityWeight);

      if (neediest.length > 0) {
        const { client } = neediest[0];
        const project = pickProject(client, uc30WeeklyHours, clientAllocated[client.id] || 0);
        allBlocks.push({
          date: dateStr,
          startTime: nw.start,
          endTime: nw.end,
          clientId: client.id,
          projectId: project?.id || null,
          title: `${client.name} Night Work`,
          type: "DeepWork",
          locked: false,
          generated: true,
          notes: "Night work session",
        });
        clientAllocated[client.id] += (nightSlot.end - nightSlot.start) / 60;
      }
    }
  }

  // Sort blocks by date then start time
  allBlocks.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  return allBlocks;
}

/**
 * Pick a non-UC30 project by default for Chandler, unless UC30 hours explicitly allocated
 */
function pickProject(
  client: ClientConfig,
  uc30WeeklyHours: number,
  hoursAllocated: number
): { id: string; name: string } | null {
  if (client.projects.length === 0) return null;

  // For Chandler-like clients with UC30 tag
  const uc30Projects = client.projects.filter((p) => p.tags.includes("UC30"));
  const nonUc30Projects = client.projects.filter((p) => !p.tags.includes("UC30"));

  if (uc30Projects.length > 0 && nonUc30Projects.length > 0) {
    // Only use UC30 if explicitly allocated and we haven't exceeded
    if (uc30WeeklyHours > 0 && hoursAllocated < uc30WeeklyHours) {
      return uc30Projects[0];
    }
    // Otherwise prefer non-UC30
    // Pick by weight
    const sorted = nonUc30Projects.sort((a, b) => b.weight - a.weight);
    return sorted[0];
  }

  // No UC30 distinction, pick highest-weight project
  const sorted = [...client.projects].sort((a, b) => b.weight - a.weight);
  return sorted[0];
}

/**
 * Split a client's total minutes across their projects by weight.
 * Returns project allocations sorted by minutes descending.
 * Minimum block size is 15 minutes; remainders go to highest-weight project.
 */
function splitByProject(
  client: ClientConfig,
  totalMinutes: number,
  uc30WeeklyHours: number,
  hoursAllocated: number
): { projectId: string | null; title: string; minutes: number }[] {
  if (client.projects.length === 0) {
    return [{ projectId: null, title: `${client.name} Deep Work`, minutes: totalMinutes }];
  }

  if (client.projects.length === 1) {
    const p = client.projects[0];
    return [{ projectId: p.id, title: `${client.name} - ${p.name}`, minutes: totalMinutes }];
  }

  // Handle UC30 carve-out: reserve UC30 hours first, rest goes to other projects
  const uc30Projects = client.projects.filter((p) => p.tags.includes("UC30"));
  const nonUc30Projects = client.projects.filter((p) => !p.tags.includes("UC30"));

  let projectsToSplit = client.projects;
  const result: { projectId: string | null; title: string; minutes: number }[] = [];
  let minutesRemaining = totalMinutes;

  if (uc30Projects.length > 0 && nonUc30Projects.length > 0 && uc30WeeklyHours > 0) {
    // UC30 gets a fixed portion, not weight-based
    const uc30MinutesTarget = Math.max(0, (uc30WeeklyHours - hoursAllocated) * 60);
    const uc30Minutes = Math.min(roundTo15(Math.min(uc30MinutesTarget, totalMinutes)), totalMinutes);
    if (uc30Minutes >= 15) {
      result.push({
        projectId: uc30Projects[0].id,
        title: `${client.name} - ${uc30Projects[0].name}`,
        minutes: uc30Minutes,
      });
      minutesRemaining -= uc30Minutes;
    }
    projectsToSplit = nonUc30Projects;
  }

  if (minutesRemaining < 15 || projectsToSplit.length === 0) {
    return result.length > 0 ? result : [{ projectId: null, title: `${client.name} Deep Work`, minutes: totalMinutes }];
  }

  // Distribute remaining minutes by weight
  const totalWeight = projectsToSplit.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) {
    result.push({
      projectId: projectsToSplit[0].id,
      title: `${client.name} - ${projectsToSplit[0].name}`,
      minutes: minutesRemaining,
    });
    return result;
  }

  const rawAllocations = projectsToSplit.map((p) => ({
    project: p,
    minutes: roundTo15((p.weight / totalWeight) * minutesRemaining),
  }));

  // Adjust so total matches minutesRemaining (rounding can cause drift)
  const allocatedSoFar = rawAllocations.reduce((sum, a) => sum + a.minutes, 0);
  let diff = minutesRemaining - allocatedSoFar;
  // Sort by weight desc so adjustment goes to highest-weight project
  rawAllocations.sort((a, b) => b.project.weight - a.project.weight);
  if (diff !== 0 && rawAllocations.length > 0) {
    rawAllocations[0].minutes += diff;
  }

  for (const a of rawAllocations) {
    if (a.minutes >= 15) {
      result.push({
        projectId: a.project.id,
        title: `${client.name} - ${a.project.name}`,
        minutes: a.minutes,
      });
    }
  }

  return result.length > 0 ? result : [{ projectId: null, title: `${client.name} Deep Work`, minutes: totalMinutes }];
}

function roundTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/**
 * Compute available work slots for a day after removing breaks.
 */
export function computeAvailableSlots(
  dayStart: string,
  dayEnd: string,
  fixedBreaks: BreakConfig[],
  lunchReserve: BreakConfig | null,
  nightWork: { enabled: boolean; start: string; end: string } | undefined,
  earliestStart?: string
): TimeSlot[] {
  let startMin = timeToMinutes(dayStart);
  const endMin = timeToMinutes(dayEnd);

  // If generating from "now", adjust start
  if (earliestStart) {
    const nowMin = timeToMinutes(earliestStart);
    startMin = Math.max(startMin, nowMin);
  }

  if (startMin >= endMin) return nightWork?.enabled ? [{ start: timeToMinutes(nightWork.start), end: timeToMinutes(nightWork.end) }] : [];

  // Collect all break intervals (sorted)
  const breaks: TimeSlot[] = [];
  for (const brk of fixedBreaks) {
    breaks.push({ start: timeToMinutes(brk.start), end: timeToMinutes(brk.end) });
  }
  if (lunchReserve) {
    breaks.push({ start: timeToMinutes(lunchReserve.start), end: timeToMinutes(lunchReserve.end) });
  }
  breaks.sort((a, b) => a.start - b.start);

  // Subtract breaks from [startMin, endMin]
  const slots: TimeSlot[] = [];
  let cursor = startMin;

  for (const brk of breaks) {
    if (brk.start > cursor && brk.start < endMin) {
      slots.push({ start: cursor, end: Math.min(brk.start, endMin) });
    }
    cursor = Math.max(cursor, brk.end);
  }

  if (cursor < endMin) {
    slots.push({ start: cursor, end: endMin });
  }

  // Filter out tiny slots (< 15 min)
  const result = slots.filter((s) => s.end - s.start >= 15);

  // Add night window if enabled
  if (nightWork?.enabled) {
    result.push({ start: timeToMinutes(nightWork.start), end: timeToMinutes(nightWork.end) });
  }

  return result;
}

/**
 * Generate warnings about schedule
 */
export function generateWarnings(
  blocks: GeneratedBlock[],
  clients: ClientConfig[],
  monthlyHoursUsed: Record<string, number> = {}
): string[] {
  const warnings: string[] = [];
  const clientHours: Record<string, number> = {};

  for (const block of blocks) {
    if (block.clientId && (block.type === "DeepWork" || block.type === "Support")) {
      const duration = (timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / 60;
      clientHours[block.clientId] = (clientHours[block.clientId] || 0) + duration;
    }
  }

  for (const client of clients) {
    const weekHours = clientHours[client.id] || 0;
    if (weekHours > client.weeklyTargetHours * 1.1) {
      warnings.push(
        `${client.name}: ${weekHours.toFixed(1)}h scheduled this week exceeds weekly target of ${client.weeklyTargetHours}h`
      );
    }
    // Check actual monthly total (hours already used + this week's scheduled hours)
    const priorMonthHours = monthlyHoursUsed[client.id] || 0;
    const totalMonthly = priorMonthHours + weekHours;
    if (totalMonthly > client.monthlyCapHours) {
      warnings.push(
        `${client.name}: ${totalMonthly.toFixed(1)}h total this month exceeds monthly cap of ${client.monthlyCapHours}h`
      );
    }
  }

  // Check UC30 expansion
  for (const block of blocks) {
    if (block.projectId) {
      // We'll check UC30 in the API since we need project data
    }
  }

  // Check context switching
  const dayBlocks: Record<string, GeneratedBlock[]> = {};
  for (const block of blocks) {
    if (!dayBlocks[block.date]) dayBlocks[block.date] = [];
    dayBlocks[block.date].push(block);
  }

  for (const [date, dBlocks] of Object.entries(dayBlocks)) {
    const clientSwitches = new Set<string>();
    for (const b of dBlocks) {
      if (b.clientId) clientSwitches.add(b.clientId);
    }
    if (clientSwitches.size > 3) {
      warnings.push(`${date}: ${clientSwitches.size} different clients — high context switching`);
    }
  }

  return warnings;
}
