"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Timer, Play, Square, AlertTriangle, Copy, Check, ClockArrowUp } from "lucide-react";
import { formatTime } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 hover:bg-muted rounded"
      title="Copy time range"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

interface Client {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

interface Task {
  id: string;
  title: string;
  projectId: string;
  project: { clientId: string };
}

interface TimeEntry {
  id: string;
  startAt: string;
  endAt: string | null;
  durationMinutes: number | null;
  clientId: string;
  projectId: string | null;
  taskId: string | null;
  notes: string;
  client: Client;
  project?: { name: string } | null;
  task?: { title: string } | null;
}

interface ScheduleBlock {
  id: string;
  clientId: string | null;
  title: string;
  startTime: string;
  endTime: string;
}

export default function TimerPage() {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [currentBlock, setCurrentBlock] = useState<ScheduleBlock | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [pendingStart, setPendingStart] = useState<(() => void) | null>(null);

  // Inline create
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [createClientFor, setCreateClientFor] = useState<"timer" | "manual">("timer");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [createProjectFor, setCreateProjectFor] = useState<"timer" | "manual">("timer");

  // Manual entry
  const [showManual, setShowManual] = useState(false);
  const [manualClientId, setManualClientId] = useState("");
  const [manualProjectId, setManualProjectId] = useState("");
  const [manualTaskId, setManualTaskId] = useState("");
  const [manualDate, setManualDate] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }));
  const [manualStart, setManualStart] = useState("09:00");
  const [manualEnd, setManualEnd] = useState("10:00");
  const [manualNotes, setManualNotes] = useState("");

  const loadData = useCallback(async () => {
    const [clientsData, projectsData, tasksData, activeData] = await Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/tasks?status=InProgress").then((r) => r.json()),
      fetch("/api/timer?active=true").then((r) => r.json()),
    ]);

    setClients(clientsData);
    setProjects(projectsData);
    setTasks(tasksData);

    if (activeData) {
      setActiveEntry(activeData);
    }

    // Get today's date for filtering entries
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    const entries = await fetch(`/api/timer?startDate=${today}&endDate=${today}`).then((r) => r.json());
    setTodayEntries(entries);

    // Get current schedule block
    const now = new Date();
    const weekDay = now.getDay();
    if (weekDay >= 1 && weekDay <= 5) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((weekDay + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      const blocks = await fetch(
        `/api/schedule?weekStart=${weekStart.toLocaleDateString("en-CA", { timeZone: "America/Chicago" })}&weekEnd=${weekEnd.toLocaleDateString("en-CA", { timeZone: "America/Chicago" })}`
      ).then((r) => r.json());

      const currentTime = now.toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      const todayBlocks = blocks.filter((b: ScheduleBlock & { date: string }) => b.date === today);
      const current = todayBlocks.find(
        (b: ScheduleBlock & { date: string }) => b.startTime <= currentTime && b.endTime > currentTime && b.clientId
      );
      if (current) {
        setCurrentBlock(current);
        if (!activeData && current.clientId) {
          setSelectedClientId(current.clientId);
        }
      }
    }

    if (activeData?.clientId) {
      setSelectedClientId(activeData.clientId);
      if (activeData.projectId) setSelectedProjectId(activeData.projectId);
    } else if (clientsData.length > 0 && !selectedClientId) {
      setSelectedClientId(clientsData[0].id);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer tick
  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }
    function tick() {
      const start = new Date(activeEntry!.startAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const clientProjects = projects.filter((p) => p.clientId === selectedClientId);
  const projectTasks = tasks.filter(
    (t) => t.projectId === selectedProjectId || t.project.clientId === selectedClientId
  );

  function formatElapsed(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  async function startTimer() {
    // Check for context switching
    if (currentBlock?.clientId && selectedClientId !== currentBlock.clientId && !activeEntry) {
      setPendingStart(() => doStart);
      setShowSwitchWarning(true);
      return;
    }
    await doStart();
  }

  async function doStart() {
    const res = await fetch("/api/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedClientId,
        projectId: selectedProjectId || null,
        taskId: selectedTaskId || null,
        notes,
      }),
    });
    if (res.ok) {
      const entry = await res.json();
      setActiveEntry(entry);
      setNotes("");
      loadData();
    }
  }

  async function stopTimer() {
    if (!activeEntry) return;
    const res = await fetch("/api/timer/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeEntry.id, notes }),
    });
    if (res.ok) {
      setActiveEntry(null);
      setElapsed(0);
      loadData();
    }
  }

  const manualClientProjects = projects.filter((p) => p.clientId === manualClientId);
  const manualProjectTasks = tasks.filter(
    (t) => t.projectId === manualProjectId || t.project.clientId === manualClientId
  );

  async function submitManualEntry() {
    if (!manualClientId || !manualDate || !manualStart || !manualEnd) return;
    const startAt = new Date(`${manualDate}T${manualStart}:00`);
    const endAt = new Date(`${manualDate}T${manualEnd}:00`);
    if (endAt <= startAt) return;

    const res = await fetch("/api/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manual: true,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        clientId: manualClientId,
        projectId: manualProjectId || null,
        taskId: manualTaskId || null,
        notes: manualNotes,
      }),
    });
    if (res.ok) {
      setShowManual(false);
      setManualNotes("");
      loadData();
    }
  }

  function handleClientChange(value: string, target: "timer" | "manual") {
    if (value === "__create__") {
      setCreateClientFor(target);
      setNewClientName("");
      setShowCreateClient(true);
      return;
    }
    if (target === "timer") setSelectedClientId(value);
    else { setManualClientId(value); setManualProjectId(""); setManualTaskId(""); }
  }

  function handleProjectChange(value: string, target: "timer" | "manual") {
    if (value === "__create__") {
      setCreateProjectFor(target);
      setNewProjectName("");
      setShowCreateProject(true);
      return;
    }
    if (target === "timer") setSelectedProjectId(value);
    else { setManualProjectId(value); setManualTaskId(""); }
  }

  async function createClient() {
    if (!newClientName.trim()) return;
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newClientName.trim() }),
    });
    if (res.ok) {
      const client = await res.json();
      setClients((prev) => [...prev, client]);
      if (createClientFor === "timer") setSelectedClientId(client.id);
      else { setManualClientId(client.id); setManualProjectId(""); }
      setShowCreateClient(false);
    }
  }

  async function createProject() {
    const parentClientId = createProjectFor === "timer" ? selectedClientId : manualClientId;
    if (!newProjectName.trim() || !parentClientId) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: parentClientId, name: newProjectName.trim() }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects((prev) => [...prev, project]);
      if (createProjectFor === "timer") setSelectedProjectId(project.id);
      else setManualProjectId(project.id);
      setShowCreateProject(false);
    }
  }

  // Today's totals by client
  const clientTotals: Record<string, number> = {};
  for (const entry of todayEntries) {
    if (entry.durationMinutes) {
      clientTotals[entry.clientId] = (clientTotals[entry.clientId] || 0) + entry.durationMinutes;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Time Tracker</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!manualClientId && clients.length > 0) setManualClientId(clients[0].id);
            setShowManual(true);
          }}
        >
          <ClockArrowUp className="h-4 w-4 mr-1" /> Log Hours
        </Button>
      </div>

      {/* Active timer */}
      <Card className={activeEntry ? "ring-2 ring-green-500" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            {activeEntry ? "Timer Running" : "Start Timer"}
            {activeEntry && (
              <span className="text-2xl font-mono text-green-600">{formatElapsed(elapsed)}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeEntry ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeEntry.client.color }} />
                <span className="font-medium">{activeEntry.client.name}</span>
                {activeEntry.project && <span className="text-muted-foreground">/ {activeEntry.project.name}</span>}
                {activeEntry.task && <span className="text-muted-foreground">/ {activeEntry.task.title}</span>}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1"
                />
                <Button variant="destructive" onClick={stopTimer}>
                  <Square className="h-4 w-4 mr-1" /> Stop
                </Button>
              </div>
            </>
          ) : (
            <>
              {currentBlock && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Current block: <strong>{currentBlock.title}</strong> ({currentBlock.startTime} - {currentBlock.endTime})
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Client</Label>
                  <Select value={selectedClientId} onValueChange={(v) => handleClientChange(v, "timer")}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="__create__" className="text-primary font-medium">+ New Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Project</Label>
                  <Select value={selectedProjectId} onValueChange={(v) => handleProjectChange(v, "timer")}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clientProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {selectedClientId && <SelectItem value="__create__" className="text-primary font-medium">+ New Project</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Task</Label>
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projectTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={startTimer} disabled={!selectedClientId}>
                  <Play className="h-4 w-4 mr-1" /> Start
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Today's summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today&apos;s Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            {clients.map((client) => {
              const mins = clientTotals[client.id] || 0;
              return (
                <div key={client.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                    <span className="text-sm">{client.name}</span>
                  </div>
                  <span className="text-sm font-mono">{(mins / 60).toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today&apos;s Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries today</p>
          ) : (
            <div className="space-y-2">
              {todayEntries.filter((e) => e.durationMinutes).map((entry) => {
                const startDate = new Date(entry.startAt);
                const endDate = entry.endAt ? new Date(entry.endAt) : null;
                const startStr = startDate.toLocaleTimeString("en-US", {
                  timeZone: "America/Chicago",
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endStr = endDate
                  ? endDate.toLocaleTimeString("en-US", {
                      timeZone: "America/Chicago",
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";
                const hrs = Math.floor((entry.durationMinutes || 0) / 60);
                const mins = Math.round((entry.durationMinutes || 0) % 60);
                const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                const clipboardText = `${formatTime(startStr)} – ${formatTime(endStr)} (${durationStr})`;

                return (
                  <div key={entry.id} className="p-2 border rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.client.color }} />
                        <span className="text-sm font-medium">{entry.client.name}</span>
                        {entry.project && <span className="text-muted-foreground text-xs">/ {entry.project.name}</span>}
                        {entry.task && <span className="text-muted-foreground text-xs">/ {entry.task.title}</span>}
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">{durationStr}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">
                        {formatTime(startStr)} – {formatTime(endStr)}
                      </span>
                      <CopyButton text={clipboardText} />
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total today */}
      {todayEntries.filter((e) => e.durationMinutes).length > 0 && (
        <div className="text-right text-sm text-muted-foreground">
          Total today:{" "}
          <span className="font-mono font-medium text-foreground">
            {(() => {
              const totalMins = todayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
              const h = Math.floor(totalMins / 60);
              const m = Math.round(totalMins % 60);
              return h > 0 ? `${h}h ${m}m` : `${m}m`;
            })()}
          </span>
        </div>
      )}

      {/* Context switch warning dialog */}
      <Dialog open={showSwitchWarning} onOpenChange={setShowSwitchWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Context Switch Warning
            </DialogTitle>
            <DialogDescription>
              You&apos;re starting a timer for a different client than the current schedule block.
              This increases context switching. Continue?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSwitchWarning(false)}>Cancel</Button>
            <Button onClick={() => { setShowSwitchWarning(false); pendingStart?.(); }}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create client dialog */}
      <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Create a new client to track time against.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Client Name</Label>
              <Input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. Acme Corp"
                onKeyDown={(e) => e.key === "Enter" && createClient()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateClient(false)}>Cancel</Button>
              <Button onClick={createClient} disabled={!newClientName.trim()}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create project dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a new project under the selected client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Project Name</Label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Website Redesign"
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateProject(false)}>Cancel</Button>
              <Button onClick={createProject} disabled={!newProjectName.trim()}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual entry dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Hours Manually</DialogTitle>
            <DialogDescription>
              Add a completed time entry with specific start and end times.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
              </div>
            </div>
            {manualStart && manualEnd && manualEnd > manualStart && (
              <div className="text-xs text-muted-foreground">
                Duration: {(() => {
                  const [sh, sm] = manualStart.split(":").map(Number);
                  const [eh, em] = manualEnd.split(":").map(Number);
                  const mins = (eh * 60 + em) - (sh * 60 + sm);
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return h > 0 ? `${h}h ${m}m` : `${m}m`;
                })()}
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Client</Label>
              <Select value={manualClientId} onValueChange={(v) => handleClientChange(v, "manual")}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="__create__" className="text-primary font-medium">+ New Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Project</Label>
              <Select value={manualProjectId} onValueChange={(v) => handleProjectChange(v, "manual")}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {manualClientProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {manualClientId && <SelectItem value="__create__" className="text-primary font-medium">+ New Project</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Task</Label>
              <Select value={manualTaskId} onValueChange={setManualTaskId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {manualProjectTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Notes..." value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowManual(false)}>Cancel</Button>
              <Button onClick={submitManualEntry} disabled={!manualClientId || !manualDate || !manualStart || !manualEnd || manualEnd <= manualStart}>
                Log Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
