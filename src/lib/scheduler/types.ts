export interface AvailabilityWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  enabled: boolean;
}

export interface BreakConfig {
  start: string;
  end: string;
  title: string;
  locked: boolean;
}

export interface NightWorkConfig {
  enabled: boolean;
  start: string;
  end: string;
}

export interface ClientConfig {
  id: string;
  name: string;
  weeklyTargetHours: number;
  monthlyCapHours: number;
  priorityWeight: number;
  style: "DeepWork" | "Support" | "Mixed";
  dailyTouch: boolean;
  projects: ProjectConfig[];
}

export interface ProjectConfig {
  id: string;
  name: string;
  tags: string[];
  weight: number;
}

export interface SchedulerInput {
  weekDates: string[]; // YYYY-MM-DD for Mon-Fri
  availability: Record<string, AvailabilityWindow>; // dayKey -> window
  fixedBreaks: BreakConfig[];
  lunchReserve: BreakConfig | null;
  nightWork: Record<string, NightWorkConfig>;
  clients: ClientConfig[];
  deepWorkSplit: { clientId: string; weight: number }[];
  supportSweepMinutes: number;
  generateFromNow: boolean;
  currentTime?: string; // HH:mm for today
  today?: string; // YYYY-MM-DD
  lockedBlockIds?: string[];
  existingBlocks?: GeneratedBlock[];
  uc30WeeklyHours: number;
  monthlyHoursUsed: Record<string, number>; // clientId -> hours already scheduled this month (outside current week)
}

export interface GeneratedBlock {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  clientId: string | null;
  projectId: string | null;
  title: string;
  type: "Support" | "DeepWork" | "Break" | "Admin" | "Lunch";
  locked: boolean;
  generated: boolean;
  notes: string;
}
