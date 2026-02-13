"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatTime, timeToMinutes, getWeekDates, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Palmtree,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Clock,
  CalendarClock,
} from "lucide-react";

interface ClientInfo {
  id: string;
  name: string;
  color: string;
  monthlyCapHours: number;
  isPersonal: boolean;
  dailyTouch: boolean;
  projects?: { id: string; name: string }[];
}

interface AvailabilityWindow {
  start: string;
  end: string;
  enabled: boolean;
}

type ViewMode = "work" | "personal" | "all";

interface FloatingTask {
  id: string;
  title: string;
  estimateMinutes: number;
  clientId: string | null;
  projectId: string | null;
  dueDate: string | null;
  priority: string;
  mustSchedule: boolean;
  status: string;
  notes: string;
  client?: { name: string; color: string } | null;
  project?: { name: string } | null;
}

interface CalendarEvent {
  uid: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  feedId: string;
  feedName: string;
  feedColor: string;
}

interface ScheduleBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientId: string | null;
  projectId: string | null;
  title: string;
  type: string;
  locked: boolean;
  generated: boolean;
  notes: string;
  client?: { name: string; color: string } | null;
  project?: { name: string } | null;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePage() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingDay, setGeneratingDay] = useState<string | null>(null);
  const [keepLocked, setKeepLocked] = useState(true);
  const [keepManual, setKeepManual] = useState(true);
  const [generateFromNow, setGenerateFromNow] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [today, setToday] = useState("");
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [monthlyHours, setMonthlyHours] = useState<Record<string, number>>({});
  const [timeOffDates, setTimeOffDates] = useState<Set<string>>(new Set());
  const [timeOffs, setTimeOffs] = useState<{ title: string; type: string; startDate: string; endDate: string }[]>([]);
  const [floatingTasks, setFloatingTasks] = useState<FloatingTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", estimateMinutes: 60, clientId: "", projectId: "", dueDate: "", priority: "P2", mustSchedule: true });
  const [viewMode, setViewMode] = useState<ViewMode>("work");
  const [availabilityWindows, setAvailabilityWindows] = useState<Record<string, AvailabilityWindow>>({});
  const [autoDetect, setAutoDetect] = useState(true);
  const activeBlockRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const weekDates = getWeekDates(
    new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000)
  );
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  const currentMonth = weekStart.slice(0, 7); // YYYY-MM

  const fetchMonthlyHours = useCallback(async () => {
    try {
      const res = await fetch(`/api/timer/monthly?month=${currentMonth}`);
      const data = await res.json();
      if (!res.ok) return;
      setMonthlyHours(data);
    } catch { /* ignore */ }
  }, [currentMonth]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?include=projects");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.availabilityJson) {
        setAvailabilityWindows(JSON.parse(data.availabilityJson));
      }
    } catch { /* ignore */ }
  }, []);

  const fetchFloatingTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule/floating-tasks");
      const data = await res.json();
      setFloatingTasks(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar-feeds/sync?startDate=${weekStart}&endDate=${weekEnd}`);
      const data = await res.json();
      setCalendarEvents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [weekStart, weekEnd]);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?weekStart=${weekStart}&weekEnd=${weekEnd}`);
      const data = await res.json();
      setBlocks(Array.isArray(data) ? data : []);
    } catch {
      setBlocks([]);
    }
    setLoading(false);
  }, [weekStart, weekEnd]);

  const fetchTimeOff = useCallback(async () => {
    try {
      const res = await fetch(`/api/timeoff?startDate=${weekStart}&endDate=${weekEnd}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTimeOffs(data.map((t: { title: string; type: string; startDate: string; endDate: string }) => ({
          title: t.title, type: t.type, startDate: t.startDate, endDate: t.endDate,
        })));
        // Build date set
        const dates = new Set<string>();
        for (const to of data) {
          const start = new Date(to.startDate + "T12:00:00");
          const end = new Date(to.endDate + "T12:00:00");
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.add(d.toISOString().slice(0, 10));
          }
        }
        setTimeOffDates(dates);
      }
    } catch { /* ignore */ }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchBlocks();
    fetchMonthlyHours();
    fetchTimeOff();
    fetchCalendarEvents();
  }, [fetchBlocks, fetchMonthlyHours, fetchTimeOff, fetchCalendarEvents]);

  useEffect(() => {
    fetchClients();
    fetchFloatingTasks();
    fetchSettings();
  }, [fetchClients, fetchFloatingTasks, fetchSettings]);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "America/Chicago",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setToday(now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }));
    }
    tick();
    const interval = setInterval(tick, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to active block on initial load
  useEffect(() => {
    if (!hasScrolled.current && activeBlockRef.current && currentTime) {
      hasScrolled.current = true;
      setTimeout(() => {
        activeBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [currentTime, blocks]);

  // Auto-detect work vs personal view based on current time and availability
  useEffect(() => {
    if (!autoDetect || !currentTime || Object.keys(availabilityWindows).length === 0) return;
    const now = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayKey = dayNames[now.getDay()];
    const window = availabilityWindows[dayKey];

    if (!window || !window.enabled) {
      // Not a work day — show personal
      setViewMode("personal");
      return;
    }

    const nowMins = timeToMinutes(currentTime);
    const startMins = timeToMinutes(window.start);
    const endMins = timeToMinutes(window.end);

    if (nowMins >= startMins && nowMins < endMins) {
      setViewMode("work");
    } else {
      setViewMode("personal");
    }
  }, [autoDetect, currentTime, availabilityWindows]);

  // Build set of personal client IDs for filtering
  const personalClientIds = new Set(clients.filter((c) => c.isPersonal).map((c) => c.id));

  // Filter blocks based on view mode
  function filterBlocksByView(allBlocks: ScheduleBlock[]): ScheduleBlock[] {
    if (viewMode === "all") return allBlocks;
    if (viewMode === "personal") {
      return allBlocks.filter((b) => {
        if (!b.clientId) return false; // non-client blocks (break, lunch, admin) only in work view
        return personalClientIds.has(b.clientId);
      });
    }
    // work mode: show everything except personal client blocks
    return allBlocks.filter((b) => {
      if (!b.clientId) return true; // breaks, lunch, admin, external
      return !personalClientIds.has(b.clientId);
    });
  }

  async function toggleDailyTouch(clientId: string, value: boolean) {
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyTouch: value }),
    });
    if (res.ok) {
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, dailyTouch: value } : c));
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      // Only generate for today and future days (skip past days)
      const datesToGenerate = weekDates
        .map(formatDate)
        .filter((d) => d >= today);

      if (datesToGenerate.length === 0) {
        setWarnings(["No future days to generate in this week."]);
        setGenerating(false);
        return;
      }

      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekDates: datesToGenerate,
          keepLocked,
          keepManual,
          generateFromNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWarnings([data.error || "Failed to generate schedule"]);
      } else {
        const newBlocks: ScheduleBlock[] = Array.isArray(data.blocks) ? data.blocks : [];
        // Merge: keep past-day blocks that weren't regenerated, add new ones
        setBlocks((prev) => [
          ...prev.filter((b) => !datesToGenerate.includes(b.date)),
          ...newBlocks,
        ]);
        setWarnings(data.warnings || []);
        if (data.monthlyHoursUsed) setMonthlyHours(data.monthlyHoursUsed);
        if (data.timeOffDates) setTimeOffDates(new Set(data.timeOffDates));
        if (data.timeOffs) setTimeOffs(data.timeOffs);
        fetchFloatingTasks(); // refresh task statuses
      }
    } catch {
      setWarnings(["Failed to generate schedule"]);
    }
    setGenerating(false);
  }

  async function handleGenerateDay(dateStr: string) {
    setGeneratingDay(dateStr);
    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekDates: [dateStr],
          keepLocked,
          keepManual,
          generateFromNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWarnings([data.error || "Failed to generate schedule"]);
      } else {
        const newDayBlocks: ScheduleBlock[] = Array.isArray(data.blocks) ? data.blocks : [];
        setBlocks((prev) => [
          ...prev.filter((b) => b.date !== dateStr),
          ...newDayBlocks,
        ]);
        setWarnings(data.warnings || []);
        if (data.monthlyHoursUsed) setMonthlyHours(data.monthlyHoursUsed);
      }
    } catch {
      setWarnings(["Failed to generate schedule"]);
    }
    setGeneratingDay(null);
  }

  async function toggleLock(block: ScheduleBlock) {
    const res = await fetch(`/api/schedule/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !block.locked }),
    });
    if (res.ok) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? { ...b, locked: !b.locked } : b))
      );
    }
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  async function addFloatingTask() {
    if (!newTask.title.trim()) return;
    try {
      await fetch("/api/schedule/floating-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          estimateMinutes: newTask.estimateMinutes,
          clientId: newTask.clientId || null,
          projectId: newTask.projectId || null,
          dueDate: newTask.dueDate || null,
          priority: newTask.priority,
          mustSchedule: newTask.mustSchedule,
        }),
      });
      setNewTask({ title: "", estimateMinutes: 60, clientId: "", projectId: "", dueDate: "", priority: "P2", mustSchedule: true });
      setShowAddTask(false);
      fetchFloatingTasks();
    } catch { /* ignore */ }
  }

  async function deleteFloatingTask(id: string) {
    await fetch(`/api/schedule/floating-tasks/${id}`, { method: "DELETE" });
    setFloatingTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function toggleTaskComplete(task: FloatingTask) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    await fetch(`/api/schedule/floating-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchFloatingTasks();
  }

  async function resetTaskToPending(task: FloatingTask) {
    await fetch(`/api/schedule/floating-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    fetchFloatingTasks();
  }

  function blocksByDate(date: string) {
    return filterBlocksByView(blocks.filter((b) => b.date === date));
  }

  function getBlockClass(type: string) {
    const map: Record<string, string> = {
      DeepWork: "block-deepwork",
      Support: "block-support",
      Break: "block-break",
      Admin: "block-admin",
      Lunch: "block-lunch",
      Task: "block-task",
      External: "block-external",
      Personal: "block-personal",
    };
    return map[type] || "block-deepwork";
  }

  function isPast(block: ScheduleBlock): boolean {
    if (block.date < today) return true;
    if (block.date === today) {
      return timeToMinutes(block.endTime) <= timeToMinutes(currentTime);
    }
    return false;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Week of {new Date(weekStart + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" - "}
            {new Date(weekEnd + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-md border overflow-hidden text-sm">
          <button
            className={`px-3 py-1.5 ${viewMode === "work" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => { setViewMode("work"); setAutoDetect(false); }}
          >
            Work
          </button>
          <button
            className={`px-3 py-1.5 border-x ${viewMode === "personal" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => { setViewMode("personal"); setAutoDetect(false); }}
          >
            Personal
          </button>
          <button
            className={`px-3 py-1.5 ${viewMode === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => { setViewMode("all"); setAutoDetect(false); }}
          >
            All
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            id="autoDetect"
            checked={autoDetect}
            onCheckedChange={setAutoDetect}
          />
          <Label htmlFor="autoDetect" className="text-xs text-muted-foreground">Auto</Label>
        </div>
      </div>

      {/* Generate controls */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="keepLocked" checked={keepLocked} onCheckedChange={setKeepLocked} />
                <Label htmlFor="keepLocked" className="text-sm">Keep locked</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="keepManual" checked={keepManual} onCheckedChange={setKeepManual} />
                <Label htmlFor="keepManual" className="text-sm">Keep manual</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="fromNow" checked={generateFromNow} onCheckedChange={setGenerateFromNow} />
                <Label htmlFor="fromNow" className="text-sm">From now</Label>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate Schedule"}
            </Button>
          </div>
          {/* Daily required clients */}
          {clients.filter((c) => !c.isPersonal).length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Required daily (guaranteed a block every day)</p>
              <div className="flex flex-wrap gap-2">
                {clients.filter((c) => !c.isPersonal).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => toggleDailyTouch(client.id, !client.dailyTouch)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                      client.dailyTouch
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color }} />
                    {client.name}
                    {client.dailyTouch && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly hours summary (work clients only) */}
      {viewMode !== "personal" && clients.filter((c) => !c.isPersonal).length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">
              Monthly Hours Tracked &mdash; {new Date(weekStart + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {clients.filter((c) => !c.isPersonal).map((client) => {
                const used = monthlyHours[client.id] || 0;
                const cap = client.monthlyCapHours;
                const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
                return (
                  <div key={client.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                        <span>{client.name}</span>
                      </div>
                      <span className="font-mono">{used.toFixed(1)}h / {cap}h</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-800">{w}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Tasks */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              One-Off Tasks
              {floatingTasks.filter((t) => t.status === "pending").length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {floatingTasks.filter((t) => t.status === "pending").length} pending
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowAddTask(!showAddTask)}>
              {showAddTask ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {showAddTask && (
            <div className="space-y-2 mb-3 p-3 rounded-md border bg-muted/30">
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="h-8 text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Duration (min)</label>
                  <Input
                    type="number"
                    value={newTask.estimateMinutes}
                    onChange={(e) => setNewTask({ ...newTask, estimateMinutes: parseInt(e.target.value) || 60 })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Priority</label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1" className="text-xs">P1 - High</SelectItem>
                      <SelectItem value="P2" className="text-xs">P2 - Medium</SelectItem>
                      <SelectItem value="P3" className="text-xs">P3 - Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Due date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Client</label>
                  <Select value={newTask.clientId} onValueChange={(v) => setNewTask({ ...newTask, clientId: v, projectId: "" })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTask.mustSchedule}
                    onCheckedChange={(v) => setNewTask({ ...newTask, mustSchedule: v })}
                  />
                  <Label className="text-xs">Must schedule</Label>
                </div>
                <Button size="sm" className="h-7 text-xs" onClick={addFloatingTask} disabled={!newTask.title.trim()}>
                  Add Task
                </Button>
              </div>
            </div>
          )}

          {floatingTasks.length === 0 && !showAddTask && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No one-off tasks. Add tasks that need to be done this week and the generator will find the best time slot.
            </p>
          )}

          {floatingTasks.length > 0 && (
            <div className="space-y-1">
              {floatingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    task.status === "completed" ? "opacity-50" : ""
                  } ${task.status === "scheduled" ? "bg-violet-50" : ""}`}
                >
                  <button onClick={() => toggleTaskComplete(task)} className="shrink-0">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : task.status === "scheduled" ? (
                      <Clock className="h-4 w-4 text-violet-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <span className={`flex-1 truncate ${task.status === "completed" ? "line-through" : "font-medium"}`}>
                    {task.title}
                  </span>
                  <Badge variant={task.priority === "P1" ? "destructive" : task.priority === "P2" ? "default" : "secondary"} className="text-[10px] px-1 py-0">
                    {task.priority}
                  </Badge>
                  <span className="text-muted-foreground shrink-0">{task.estimateMinutes}m</span>
                  {task.mustSchedule && <span className="shrink-0" title="Must schedule"><Lock className="h-3 w-3 text-muted-foreground" /></span>}
                  {task.dueDate && (
                    <span className="text-muted-foreground shrink-0">
                      {new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {task.client && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.client.color }} />
                  )}
                  {task.status === "scheduled" && (
                    <button onClick={() => resetTaskToPending(task)} className="text-[10px] text-muted-foreground hover:text-foreground shrink-0" title="Reset to pending">
                      Reset
                    </button>
                  )}
                  <button onClick={() => deleteFloatingTask(task.id)} className="text-red-400 hover:text-red-600 shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading schedule...</div>
      ) : (() => {
        const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        // Show weekdays always, weekends only if enabled in availability or have blocks
        const visibleDays = weekDates.filter((date, i) => {
          if (i < 5) return true; // Mon-Fri always shown
          const dk = dayKeys[i];
          const avail = availabilityWindows[dk];
          const dateStr = formatDate(date);
          const hasBlocks = blocks.some((b) => b.date === dateStr);
          return avail?.enabled || hasBlocks;
        });
        const colCount = Math.min(visibleDays.length, 7);
        const gridClass = `grid grid-cols-1 md:grid-cols-${colCount} gap-3`;
        return (
        <div className={gridClass} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
          {visibleDays.map((date) => {
            const i = weekDates.indexOf(date);
            const dateStr = formatDate(date);
            const dayBlocks = blocksByDate(dateStr);
            const isToday = dateStr === today;
            const isPastDay = dateStr < today;
            const isTimeOff = timeOffDates.has(dateStr);
            const timeOffEntry = timeOffs.find((t) => dateStr >= t.startDate && dateStr <= t.endDate);

            return (
              <Card key={dateStr} className={`${isToday ? "ring-2 ring-primary" : ""} ${isPastDay ? "opacity-60" : ""} ${isTimeOff ? "bg-purple-50 dark:bg-purple-950/20" : ""}`}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isTimeOff && <Palmtree className="h-3.5 w-3.5 text-purple-500" />}
                      <span className="hidden md:inline">{DAY_NAMES[i]}</span>
                      <span className="md:hidden">{DAY_NAMES_SHORT[i]}</span>
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        {new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {!isPastDay && !isTimeOff && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px] gap-1"
                        onClick={() => handleGenerateDay(dateStr)}
                        disabled={generatingDay === dateStr}
                      >
                        <RefreshCw className={`h-3 w-3 ${generatingDay === dateStr ? "animate-spin" : ""}`} />
                        {generatingDay === dateStr ? "..." : "Generate"}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5 relative">
                  {isTimeOff && timeOffEntry && (
                    <div className="p-2 rounded text-xs bg-purple-100 dark:bg-purple-900/30 border-l-3 border-purple-500 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Palmtree className="h-3.5 w-3.5 text-purple-500" />
                        <span className="font-medium text-purple-700 dark:text-purple-300">{timeOffEntry.title}</span>
                      </div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 block">
                        {timeOffEntry.type} &mdash; All Day
                      </span>
                    </div>
                  )}
                  {/* Calendar events (all-day) */}
                  {calendarEvents
                    .filter((e) => {
                      const eventDate = e.start.slice(0, 10);
                      return e.allDay && eventDate === dateStr;
                    })
                    .map((e) => (
                      <div key={e.uid} className="p-1.5 rounded text-xs block-external mb-1" style={{ borderLeftColor: e.feedColor }}>
                        <span className="font-medium">{e.summary}</span>
                        <span className="text-[10px] opacity-60 ml-1">All day</span>
                      </div>
                    ))}
                  {dayBlocks.length === 0 && !isTimeOff && (
                    <>
                      {isToday && currentTime && (
                        <div className="current-time-line relative my-2">
                          <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-red-500 leading-none">
                            {formatTime(currentTime)}
                          </span>
                        </div>
                      )}
                      {!isPastDay ? (
                        <button
                          onClick={() => handleGenerateDay(dateStr)}
                          disabled={generatingDay === dateStr}
                          className="w-full flex flex-col items-center gap-1.5 py-6 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                        >
                          <RefreshCw className={`h-5 w-5 ${generatingDay === dateStr ? "animate-spin" : ""}`} />
                          <span className="text-xs font-medium">{generatingDay === dateStr ? "Generating..." : "Generate this day"}</span>
                        </button>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">No blocks</p>
                      )}
                    </>
                  )}
                  {(() => {
                    const nowMin = isToday && currentTime ? timeToMinutes(currentTime) : -1;
                    const showLine = isToday && !!currentTime && !isTimeOff;

                    // Find block that contains current time
                    const activeIdx = showLine
                      ? dayBlocks.findIndex((b) =>
                          timeToMinutes(b.startTime) <= nowMin && nowMin < timeToMinutes(b.endTime))
                      : -1;

                    // If not inside any block, find the gap position
                    const gapIdx = showLine && activeIdx === -1
                      ? dayBlocks.findIndex((b) => timeToMinutes(b.startTime) > nowMin)
                      : -1;
                    const gapAfterAll = showLine && activeIdx === -1 && gapIdx === -1;

                    // Progress through active block (0 to 1)
                    const progress = activeIdx !== -1
                      ? (nowMin - timeToMinutes(dayBlocks[activeIdx].startTime)) /
                        (timeToMinutes(dayBlocks[activeIdx].endTime) - timeToMinutes(dayBlocks[activeIdx].startTime))
                      : 0;

                    const gapLine = showLine ? (
                      <div key="now-gap" className="current-time-line relative my-1">
                        <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-red-500 leading-none">
                          {formatTime(currentTime)}
                        </span>
                      </div>
                    ) : null;

                    return (
                      <>
                        {gapIdx === 0 && gapLine}
                        {dayBlocks.map((block, idx) => {
                          const isActive = activeIdx === idx;
                          return (
                            <div key={block.id} ref={isActive ? activeBlockRef : undefined}>
                              <div
                                className={`p-2 rounded text-xs relative overflow-visible ${getBlockClass(block.type)} ${
                                  isPast(block) ? "block-past" : ""
                                } ${isActive ? "block-active" : ""}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-medium truncate">{block.title}</span>
                                  <button
                                    onClick={() => toggleLock(block)}
                                    className="shrink-0 opacity-60 hover:opacity-100"
                                    title={block.locked ? "Unlock" : "Lock"}
                                  >
                                    {block.locked ? (
                                      <Lock className="h-3 w-3" />
                                    ) : (
                                      <Unlock className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] opacity-75">
                                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                  </span>
                                  {block.client && (
                                    <span
                                      className="inline-block w-2 h-2 rounded-full"
                                      style={{ backgroundColor: block.client.color }}
                                    />
                                  )}
                                </div>
                                {block.client && (
                                  <div className="mt-1">
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                      {block.client.name}
                                    </Badge>
                                    {block.project && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                                        {block.project.name}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {!block.locked && block.generated && (
                                  <button
                                    onClick={() => deleteBlock(block.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 mt-1"
                                  >
                                    Remove
                                  </button>
                                )}
                                {/* Current time indicator positioned within active block */}
                                {isActive && (
                                  <div
                                    className="current-time-line"
                                    style={{ top: `${progress * 100}%`, transition: "top 10s linear" }}
                                  >
                                    <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-red-500 leading-none">
                                      {formatTime(currentTime)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {gapIdx === idx + 1 && gapLine}
                            </div>
                          );
                        })}
                        {gapAfterAll && gapLine}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-deepwork" /> Deep Work</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-support" /> Support</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-task" /> Task</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-personal" /> Personal</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-external" /> Calendar</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-break" /> Break</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-admin" /> Admin</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-lunch" /> Lunch</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-100 border-l-2 border-purple-500" /> Time Off</div>
      </div>
    </div>
  );
}
