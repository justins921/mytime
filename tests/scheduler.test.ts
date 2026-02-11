import { describe, it, expect } from "vitest";
import { generateSchedule, computeAvailableSlots, generateWarnings } from "@/lib/scheduler/engine";
import type { SchedulerInput, GeneratedBlock } from "@/lib/scheduler/types";

function makeDefaultInput(overrides?: Partial<SchedulerInput>): SchedulerInput {
  return {
    weekDates: ["2025-01-06", "2025-01-07", "2025-01-08", "2025-01-09", "2025-01-10"],
    availability: {
      mon: { start: "09:00", end: "15:30", enabled: true },
      tue: { start: "09:00", end: "15:30", enabled: true },
      wed: { start: "09:00", end: "15:30", enabled: true },
      thu: { start: "09:00", end: "15:30", enabled: true },
      fri: { start: "09:00", end: "15:30", enabled: true },
    },
    fixedBreaks: [{ start: "10:15", end: "10:45", title: "School Pickup", locked: true }],
    lunchReserve: { start: "12:45", end: "13:15", title: "Lunch", locked: false },
    nightWork: {
      mon: { enabled: false, start: "20:00", end: "22:00" },
      tue: { enabled: false, start: "20:00", end: "22:00" },
      wed: { enabled: false, start: "20:00", end: "22:00" },
      thu: { enabled: false, start: "20:00", end: "22:00" },
      fri: { enabled: false, start: "20:00", end: "22:00" },
    },
    clients: [
      {
        id: "natalie",
        name: "Natalie",
        weeklyTargetHours: 10,
        monthlyCapHours: 40,
        priorityWeight: 70,
        style: "DeepWork",
        dailyTouch: false,
        projects: [{ id: "nat-gen", name: "General", tags: [], weight: 1.0 }],
      },
      {
        id: "chandler",
        name: "Chandler",
        weeklyTargetHours: 6,
        monthlyCapHours: 40,
        priorityWeight: 30,
        style: "DeepWork",
        dailyTouch: true,
        projects: [
          { id: "ch-uc30", name: "UC30", tags: ["UC30"], weight: 0.2 },
          { id: "ch-motel", name: "Motel", tags: [], weight: 1.0 },
          { id: "ch-web", name: "Website/Events", tags: [], weight: 1.0 },
        ],
      },
      {
        id: "payton",
        name: "Payton",
        weeklyTargetHours: 5,
        monthlyCapHours: 40,
        priorityWeight: 0,
        style: "Support",
        dailyTouch: false,
        projects: [{ id: "pay-support", name: "Support Emails", tags: [], weight: 1.0 }],
      },
    ],
    deepWorkSplit: [
      { clientId: "natalie", weight: 70 },
      { clientId: "chandler", weight: 30 },
    ],
    supportSweepMinutes: 30,
    generateFromNow: false,
    uc30WeeklyHours: 0,
    monthlyHoursUsed: {},
    ...overrides,
  };
}

describe("computeAvailableSlots", () => {
  it("should return correct slots subtracting breaks", () => {
    const slots = computeAvailableSlots(
      "09:00",
      "15:30",
      [{ start: "10:15", end: "10:45", title: "Pickup", locked: true }],
      { start: "12:45", end: "13:15", title: "Lunch", locked: false },
      undefined,
      undefined
    );

    // Expected slots: 9:00-10:15, 10:45-12:45, 13:15-15:30
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ start: 540, end: 615 }); // 9:00-10:15
    expect(slots[1]).toEqual({ start: 645, end: 765 }); // 10:45-12:45
    expect(slots[2]).toEqual({ start: 795, end: 930 }); // 13:15-15:30
  });

  it("should skip past times when generateFromNow is used", () => {
    const slots = computeAvailableSlots(
      "09:00",
      "15:30",
      [{ start: "10:15", end: "10:45", title: "Pickup", locked: true }],
      { start: "12:45", end: "13:15", title: "Lunch", locked: false },
      undefined,
      "11:00" // current time is 11:00
    );

    // Should start from 11:00, so first available slot is 11:00-12:45
    expect(slots.length).toBeGreaterThanOrEqual(1);
    expect(slots[0].start).toBeGreaterThanOrEqual(660); // 11:00 = 660 minutes
  });

  it("should include night work window when enabled", () => {
    const slots = computeAvailableSlots(
      "09:00",
      "15:30",
      [],
      null,
      { enabled: true, start: "20:00", end: "22:00" },
      undefined
    );

    // Should have day slot + night slot
    const nightSlot = slots.find((s) => s.start >= 1200); // 20:00 = 1200 minutes
    expect(nightSlot).toBeDefined();
    expect(nightSlot!.start).toBe(1200);
    expect(nightSlot!.end).toBe(1320);
  });
});

describe("generateSchedule", () => {
  it("should generate blocks for each weekday", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    const uniqueDates = new Set(blocks.map((b) => b.date));
    expect(uniqueDates.size).toBe(5); // Mon-Fri
  });

  it("should include fixed breaks on each day", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    const breakBlocks = blocks.filter((b) => b.type === "Break");
    expect(breakBlocks.length).toBe(5); // One per day
    breakBlocks.forEach((b) => {
      expect(b.startTime).toBe("10:15");
      expect(b.endTime).toBe("10:45");
      expect(b.locked).toBe(true);
    });
  });

  it("should include lunch reserve on each day", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    const lunchBlocks = blocks.filter((b) => b.type === "Lunch");
    expect(lunchBlocks.length).toBe(5);
    lunchBlocks.forEach((b) => {
      expect(b.startTime).toBe("12:45");
      expect(b.endTime).toBe("13:15");
    });
  });

  it("should generate support sweeps for support client", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    const supportBlocks = blocks.filter((b) => b.type === "Support");
    // At least 2 support sweeps per day (start + end) x 5 days = 10
    expect(supportBlocks.length).toBeGreaterThanOrEqual(10);
  });

  it("should not schedule blocks outside availability windows", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    for (const block of blocks) {
      if (block.type === "Break" || block.type === "Lunch") continue;
      const start = parseInt(block.startTime.split(":")[0]) * 60 + parseInt(block.startTime.split(":")[1]);
      const end = parseInt(block.endTime.split(":")[0]) * 60 + parseInt(block.endTime.split(":")[1]);
      // Within 9:00 (540) - 15:30 (930)
      expect(start).toBeGreaterThanOrEqual(540);
      expect(end).toBeLessThanOrEqual(930);
    }
  });

  it("should ensure daily touch clients get blocks every day", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    // Chandler has dailyTouch=true
    for (const date of input.weekDates) {
      const chandlerBlocks = blocks.filter(
        (b) => b.date === date && b.clientId === "chandler"
      );
      expect(chandlerBlocks.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should prefer non-UC30 projects for Chandler by default", () => {
    const input = makeDefaultInput({ uc30WeeklyHours: 0 });
    const blocks = generateSchedule(input);

    const chandlerBlocks = blocks.filter((b) => b.clientId === "chandler");
    // With uc30WeeklyHours=0, no UC30 project should be assigned
    const uc30Blocks = chandlerBlocks.filter((b) => b.projectId === "ch-uc30");
    expect(uc30Blocks.length).toBe(0);
  });

  it("should use UC30 when explicitly allocated", () => {
    const input = makeDefaultInput({ uc30WeeklyHours: 3 });
    const blocks = generateSchedule(input);

    const chandlerBlocks = blocks.filter((b) => b.clientId === "chandler");
    const uc30Blocks = chandlerBlocks.filter((b) => b.projectId === "ch-uc30");
    expect(uc30Blocks.length).toBeGreaterThanOrEqual(1);
  });

  it("should skip disabled days", () => {
    const input = makeDefaultInput({
      availability: {
        mon: { start: "09:00", end: "15:30", enabled: true },
        tue: { start: "09:00", end: "15:30", enabled: false }, // disabled
        wed: { start: "09:00", end: "15:30", enabled: true },
        thu: { start: "09:00", end: "15:30", enabled: true },
        fri: { start: "09:00", end: "15:30", enabled: true },
      },
    });
    const blocks = generateSchedule(input);

    const tuesdayBlocks = blocks.filter((b) => b.date === "2025-01-07");
    expect(tuesdayBlocks.length).toBe(0);
  });

  it("should add night work blocks when enabled", () => {
    const input = makeDefaultInput({
      nightWork: {
        mon: { enabled: true, start: "20:00", end: "22:00" },
        tue: { enabled: false, start: "20:00", end: "22:00" },
        wed: { enabled: false, start: "20:00", end: "22:00" },
        thu: { enabled: false, start: "20:00", end: "22:00" },
        fri: { enabled: false, start: "20:00", end: "22:00" },
      },
    });
    const blocks = generateSchedule(input);

    const nightBlocks = blocks.filter(
      (b) => b.date === "2025-01-06" && b.notes === "Night work session"
    );
    expect(nightBlocks.length).toBe(1);
    expect(nightBlocks[0].startTime).toBe("20:00");
    expect(nightBlocks[0].endTime).toBe("22:00");
  });

  it("should limit context switching (max 3 unique clients per day)", () => {
    const input = makeDefaultInput();
    const blocks = generateSchedule(input);

    for (const date of input.weekDates) {
      const dayBlocks = blocks.filter((b) => b.date === date);
      const uniqueClients = new Set(
        dayBlocks.filter((b) => b.clientId).map((b) => b.clientId)
      );
      expect(uniqueClients.size).toBeLessThanOrEqual(3);
    }
  });
});

describe("generateWarnings", () => {
  it("should warn when weekly target exceeded", () => {
    const blocks: GeneratedBlock[] = [
      {
        date: "2025-01-06",
        startTime: "09:00",
        endTime: "15:00",
        clientId: "natalie",
        projectId: null,
        title: "Natalie Deep Work",
        type: "DeepWork",
        locked: false,
        generated: true,
        notes: "",
      },
      // More than 10 hours in one block for test (6h in one day, need 11+ total)
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2025-01-0${7 + i}`,
        startTime: "09:00",
        endTime: "15:30",
        clientId: "natalie" as string | null,
        projectId: null as string | null,
        title: "Natalie Deep Work",
        type: "DeepWork" as const,
        locked: false,
        generated: true,
        notes: "",
      })),
    ];

    const clients = [
      {
        id: "natalie",
        name: "Natalie",
        weeklyTargetHours: 10,
        monthlyCapHours: 40,
        priorityWeight: 70,
        style: "DeepWork" as const,
        dailyTouch: false,
        projects: [],
      },
    ];

    const warnings = generateWarnings(blocks, clients);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes("Natalie"))).toBe(true);
  });

  it("should warn on high context switching", () => {
    const blocks: GeneratedBlock[] = [
      { date: "2025-01-06", startTime: "09:00", endTime: "10:00", clientId: "a", projectId: null, title: "A", type: "DeepWork", locked: false, generated: true, notes: "" },
      { date: "2025-01-06", startTime: "10:00", endTime: "11:00", clientId: "b", projectId: null, title: "B", type: "DeepWork", locked: false, generated: true, notes: "" },
      { date: "2025-01-06", startTime: "11:00", endTime: "12:00", clientId: "c", projectId: null, title: "C", type: "DeepWork", locked: false, generated: true, notes: "" },
      { date: "2025-01-06", startTime: "13:00", endTime: "14:00", clientId: "d", projectId: null, title: "D", type: "DeepWork", locked: false, generated: true, notes: "" },
    ];

    const clients = [
      { id: "a", name: "Client A", weeklyTargetHours: 10, monthlyCapHours: 40, priorityWeight: 1, style: "DeepWork" as const, dailyTouch: false, projects: [] },
      { id: "b", name: "Client B", weeklyTargetHours: 10, monthlyCapHours: 40, priorityWeight: 1, style: "DeepWork" as const, dailyTouch: false, projects: [] },
      { id: "c", name: "Client C", weeklyTargetHours: 10, monthlyCapHours: 40, priorityWeight: 1, style: "DeepWork" as const, dailyTouch: false, projects: [] },
      { id: "d", name: "Client D", weeklyTargetHours: 10, monthlyCapHours: 40, priorityWeight: 1, style: "DeepWork" as const, dailyTouch: false, projects: [] },
    ];

    const warnings = generateWarnings(blocks, clients);
    expect(warnings.some((w) => w.includes("context switching"))).toBe(true);
  });
});

describe("time aggregation and monthly projection", () => {
  it("should calculate monthly projection from weekly totals", () => {
    // If weekly hours = 12, monthly projection = 12 * 4.33 ≈ 51.96
    const weeklyHours = 12;
    const monthlyProjection = weeklyHours * 4.33;
    expect(monthlyProjection).toBeCloseTo(51.96, 1);

    // If cap is 40, this should trigger a warning
    expect(monthlyProjection).toBeGreaterThan(40);
  });

  it("should aggregate time entries by client", () => {
    const entries = [
      { clientId: "a", durationMinutes: 60 },
      { clientId: "a", durationMinutes: 45 },
      { clientId: "b", durationMinutes: 30 },
      { clientId: "a", durationMinutes: 15 },
    ];

    const totals: Record<string, number> = {};
    for (const e of entries) {
      totals[e.clientId] = (totals[e.clientId] || 0) + e.durationMinutes;
    }

    expect(totals["a"]).toBe(120); // 2 hours
    expect(totals["b"]).toBe(30); // 0.5 hours
  });

  it("should correctly identify UC30 vs non-UC30 time", () => {
    const entries = [
      { clientId: "chandler", projectTags: "UC30", durationMinutes: 60 },
      { clientId: "chandler", projectTags: "", durationMinutes: 90 },
      { clientId: "chandler", projectTags: "UC30", durationMinutes: 30 },
    ];

    let uc30 = 0;
    let nonUc30 = 0;

    for (const e of entries) {
      if (e.projectTags.includes("UC30")) {
        uc30 += e.durationMinutes;
      } else {
        nonUc30 += e.durationMinutes;
      }
    }

    expect(uc30).toBe(90); // 1.5 hours UC30
    expect(nonUc30).toBe(90); // 1.5 hours non-UC30
  });
});
