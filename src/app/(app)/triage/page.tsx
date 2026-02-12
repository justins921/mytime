"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Inbox,
  RefreshCw,
  Plus,
  ExternalLink,
  AlertTriangle,
  Calendar,
  X,
  EyeOff,
  Trash2,
  Clock,
} from "lucide-react";

interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: { status: string; color: string };
  priority: { id: number; priority: string; color: string } | null;
  url: string;
  due_date: string | null;
  date_updated: string;
  date_created: string;
  assignees: { id: number; username: string; profilePicture: string }[];
  tags: { name: string; tag_fg: string; tag_bg: string }[];
  list: { name: string };
  folder: { name: string };
  space: { id: string };
}

interface Team {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  color: string;
  projects: { id: string; name: string }[];
}

interface WorkspaceMap {
  [teamId: string]: string; // teamId -> clientId
}

interface TriageDismissal {
  id: string;
  clickupTaskId: string;
  action: string;
  notes: string;
}

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

function isWithinWorkHours(): boolean {
  // Check if current time is 9:00 AM – 3:30 PM Central (America/Chicago)
  const nowCentral = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const hours = nowCentral.getHours();
  const minutes = nowCentral.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  // 9:00 AM = 540 min, 3:30 PM = 930 min
  return timeInMinutes >= 540 && timeInMinutes < 930;
}

export default function TriagePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasksByTeam, setTasksByTeam] = useState<Record<string, ClickUpTask[]>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [workspaceMap, setWorkspaceMap] = useState<WorkspaceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noToken, setNoToken] = useState(false);

  // Dismissals
  const [dismissals, setDismissals] = useState<Record<string, TriageDismissal>>({});

  // Add-to-tasks dialog
  const [addingTask, setAddingTask] = useState<ClickUpTask | null>(null);
  const [addClientId, setAddClientId] = useState("");
  const [addProjectId, setAddProjectId] = useState("");
  const [addingInProgress, setAddingInProgress] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Task detail dialog
  const [detailTask, setDetailTask] = useState<{
    task: ClickUpTask;
    teamId: string;
    teamName: string;
  } | null>(null);
  const [detailNotes, setDetailNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Filters
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterDue, setFilterDue] = useState("all");

  // Auto-refresh
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadClients = useCallback(async () => {
    const data = await fetch("/api/clients").then((r) => r.json());
    setClients(Array.isArray(data) ? data : []);
  }, []);

  const loadSettings = useCallback(async () => {
    const data = await fetch("/api/settings").then((r) => r.json());
    if (!data.clickupApiToken) {
      setNoToken(true);
      return;
    }
    setNoToken(false);
    const map = JSON.parse(data.clickupWorkspaceMapJson || "{}");
    setWorkspaceMap(map);
  }, []);

  const loadDismissals = useCallback(async () => {
    try {
      const data = await fetch("/api/triage-dismissals").then((r) => r.json());
      const map: Record<string, TriageDismissal> = {};
      for (const d of data) {
        map[d.clickupTaskId] = d;
      }
      setDismissals(map);
    } catch {
      // ignore
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clickup?action=tasks");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch ClickUp tasks");
        if (data.error?.includes("not configured")) {
          setNoToken(true);
        }
      } else {
        setTeams(data.teams || []);
        setTasksByTeam(data.tasksByTeam || {});
        setLastRefresh(new Date());
      }
    } catch {
      setError("Failed to connect to ClickUp");
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadClients();
    loadSettings();
    loadDismissals();
  }, [loadClients, loadSettings, loadDismissals]);

  useEffect(() => {
    if (!noToken) {
      fetchTasks();
    }
  }, [noToken, fetchTasks]);

  // Auto-refresh: every 30 min during 9 AM – 3:30 PM Central
  useEffect(() => {
    function scheduleCheck() {
      if (isWithinWorkHours()) {
        fetchTasks();
        loadDismissals();
        setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
      } else {
        setNextRefresh(null);
      }
    }

    intervalRef.current = setInterval(scheduleCheck, AUTO_REFRESH_MS);
    // Set initial next-refresh indicator
    if (isWithinWorkHours()) {
      setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTasks, loadDismissals]);

  function handleManualRefresh() {
    fetchTasks();
    loadDismissals();
    if (isWithinWorkHours()) {
      // Reset auto-refresh timer on manual refresh
      if (intervalRef.current) clearInterval(intervalRef.current);
      setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
      intervalRef.current = setInterval(() => {
        if (isWithinWorkHours()) {
          fetchTasks();
          loadDismissals();
          setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
        } else {
          setNextRefresh(null);
        }
      }, AUTO_REFRESH_MS);
    }
  }

  function openAddDialog(task: ClickUpTask, teamId: string) {
    setAddingTask(task);
    const mappedClientId = workspaceMap[teamId] || "";
    setAddClientId(mappedClientId);
    setAddProjectId("");
  }

  async function handleAddTask() {
    if (!addingTask || !addClientId || !addProjectId) return;
    setAddingInProgress(true);
    try {
      const res = await fetch("/api/clickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clickupTask: addingTask,
          clientId: addClientId,
          projectId: addProjectId,
        }),
      });
      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(addingTask.id));
        setAddingTask(null);
      }
    } catch {
      // ignore
    }
    setAddingInProgress(false);
  }

  // Dismiss/ignore/delete a task from triage
  async function handleDismiss(clickupTaskId: string, action: string) {
    try {
      await fetch("/api/triage-dismissals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickupTaskId, action }),
      });
      setDismissals((prev) => ({
        ...prev,
        [clickupTaskId]: { id: "", clickupTaskId, action, notes: prev[clickupTaskId]?.notes || "" },
      }));
      setDetailTask(null);
    } catch {
      // ignore
    }
  }

  // Save notes for a task
  async function handleSaveNotes(clickupTaskId: string, notes: string) {
    setSavingNotes(true);
    try {
      await fetch("/api/triage-dismissals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickupTaskId, notes }),
      });
      setDismissals((prev) => ({
        ...prev,
        [clickupTaskId]: { ...(prev[clickupTaskId] || { id: "", clickupTaskId, action: "noted" }), notes },
      }));
    } catch {
      // ignore
    }
    setSavingNotes(false);
  }

  const selectedClient = clients.find((c) => c.id === addClientId);
  const clientProjects = selectedClient?.projects || [];

  // Flatten, filter, and sort all tasks
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay())); // end of Sunday
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const allFilteredTasks: { task: ClickUpTask; teamId: string; teamName: string }[] = [];
  for (const team of teams) {
    if (filterTeam !== "all" && filterTeam !== team.id) continue;
    const tasks = tasksByTeam[team.id] || [];
    for (const task of tasks) {
      // Skip dismissed/ignored/deleted tasks
      const d = dismissals[task.id];
      if (d && d.action !== "noted") continue;

      if (filterDue !== "all") {
        if (!task.due_date) continue;
        const due = new Date(parseInt(task.due_date));
        if (filterDue === "today" && due > todayEnd) continue;
        if (filterDue === "week" && due > weekEnd) continue;
        if (filterDue === "month" && due > monthEnd) continue;
      }
      allFilteredTasks.push({ task, teamId: team.id, teamName: team.name });
    }
  }
  // Sort by due date first (overdue/soonest first), then by date_updated
  allFilteredTasks.sort((a, b) => {
    const aDue = a.task.due_date ? parseInt(a.task.due_date) : Infinity;
    const bDue = b.task.due_date ? parseInt(b.task.due_date) : Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return parseInt(b.task.date_updated) - parseInt(a.task.date_updated);
  });

  // Count dismissed
  const dismissedCount = Object.values(dismissals).filter(
    (d) => d.action !== "noted"
  ).length;

  function priorityBadge(priority: ClickUpTask["priority"]) {
    if (!priority) return null;
    const colors: Record<number, string> = {
      1: "bg-red-100 text-red-800",
      2: "bg-orange-100 text-orange-800",
      3: "bg-yellow-100 text-yellow-800",
      4: "bg-blue-100 text-blue-800",
    };
    return (
      <Badge className={`text-[10px] ${colors[priority.id] || ""}`}>
        {priority.priority}
      </Badge>
    );
  }

  function dueDateBadge(due_date: string | null) {
    if (!due_date) return null;
    const due = new Date(parseInt(due_date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);

    const isOverdue = dueDay < today;
    const isToday = dueDay.getTime() === today.getTime();
    const isTomorrow = dueDay.getTime() === tomorrow.getTime();

    let label: string;
    if (isToday) label = "Due today";
    else if (isTomorrow) label = "Due tomorrow";
    else if (isOverdue) {
      const daysAgo = Math.floor((today.getTime() - dueDay.getTime()) / 86400000);
      label = `Overdue ${daysAgo}d`;
    } else {
      label = `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }

    const colorClass = isOverdue
      ? "bg-red-100 text-red-800 border-red-300"
      : isToday
        ? "bg-orange-100 text-orange-800 border-orange-300"
        : isTomorrow
          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
          : "bg-gray-100 text-gray-700 border-gray-300";

    return (
      <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
        <Calendar className="h-2.5 w-2.5 mr-0.5" />
        {label}
      </Badge>
    );
  }

  function formatUpdated(timestamp: string) {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function formatDate(timestamp: string) {
    return new Date(parseInt(timestamp)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatRefreshTime(date: Date | null) {
    if (!date) return null;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    });
  }

  if (noToken) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          <h2 className="text-xl font-semibold">ClickUp Triage</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
              <h3 className="font-medium">ClickUp API Token Required</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                To pull tasks from your ClickUp workspaces, add your Personal API Token
                in Settings. You can find it in ClickUp under Settings &rarr; Apps.
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/settings"}>
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          <h2 className="text-xl font-semibold">ClickUp Triage</h2>
          <Badge variant="secondary" className="ml-2">
            {allFilteredTasks.length} tasks
          </Badge>
          {dismissedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({dismissedCount} hidden)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterDue} onValueChange={setFilterDue}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="today">Due today / Overdue</SelectItem>
              <SelectItem value="week">Due this week</SelectItem>
              <SelectItem value="month">Due this month</SelectItem>
            </SelectContent>
          </Select>
          {teams.length > 1 && (
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspaces</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={handleManualRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auto-refresh status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {lastRefresh && <span>Last refreshed {formatRefreshTime(lastRefresh)}</span>}
        {nextRefresh ? (
          <span>&middot; Next auto-refresh ~{formatRefreshTime(nextRefresh)}</span>
        ) : (
          <span>&middot; Auto-refresh active 9 AM – 3:30 PM CT</span>
        )}
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && allFilteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          Fetching tasks from ClickUp...
        </div>
      ) : allFilteredTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No tasks found. Tasks assigned to you or that you&apos;re watching will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allFilteredTasks.map(({ task, teamId, teamName }) => {
            const isAdded = addedIds.has(task.id);
            const hasNotes = !!dismissals[task.id]?.notes;
            return (
              <Card
                key={`${teamId}-${task.id}`}
                className={`${isAdded ? "opacity-50" : "hover:border-primary/40 cursor-pointer"} transition-colors`}
                onClick={() => {
                  setDetailTask({ task, teamId, teamName });
                  setDetailNotes(dismissals[task.id]?.notes || "");
                }}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{task.name}</span>
                        {priorityBadge(task.priority)}
                        <Badge variant="outline" className="text-[10px]">
                          {task.status.status}
                        </Badge>
                        {dueDateBadge(task.due_date)}
                        {hasNotes && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Has notes
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium">{teamName}</span>
                        <span>&middot;</span>
                        <span>{task.folder?.name}</span>
                        <span>/</span>
                        <span>{task.list?.name}</span>
                        {task.assignees.length > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{task.assignees.map((a) => a.username).join(", ")}</span>
                          </>
                        )}
                        <span>&middot;</span>
                        <span>Updated {formatUpdated(task.date_updated)}</span>
                      </div>
                      {task.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {task.tags.map((tag) => (
                            <Badge
                              key={tag.name}
                              className="text-[10px] px-1 py-0"
                              style={{ backgroundColor: tag.tag_bg, color: tag.tag_fg }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {task.url && (
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-muted rounded"
                          title="Open in ClickUp"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddDialog(task, teamId)}
                        disabled={isAdded}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {isAdded ? "Added" : "Add Task"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task detail dialog */}
      <Dialog open={!!detailTask} onOpenChange={(open) => !open && setDetailTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug pr-6">
              {detailTask?.task.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Task details and actions
            </DialogDescription>
          </DialogHeader>
          {detailTask && (
            <div className="space-y-4">
              {/* Meta badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {priorityBadge(detailTask.task.priority)}
                <Badge variant="outline" className="text-[10px]">
                  {detailTask.task.status.status}
                </Badge>
                {dueDateBadge(detailTask.task.due_date)}
              </div>

              {/* Description */}
              {detailTask.task.description && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded p-3 max-h-40 overflow-auto">
                    {detailTask.task.description}
                  </p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Workspace</span>
                  <p className="font-medium">{detailTask.teamName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium">{detailTask.task.folder?.name} / {detailTask.task.list?.name}</p>
                </div>
                {detailTask.task.assignees.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Assignees</span>
                    <p className="font-medium">{detailTask.task.assignees.map((a) => a.username).join(", ")}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">{formatDate(detailTask.task.date_created)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated</span>
                  <p className="font-medium">{formatDate(detailTask.task.date_updated)}</p>
                </div>
                {detailTask.task.due_date && (
                  <div>
                    <span className="text-muted-foreground">Due date</span>
                    <p className="font-medium">{formatDate(detailTask.task.due_date)}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {detailTask.task.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {detailTask.task.tags.map((tag) => (
                    <Badge
                      key={tag.name}
                      className="text-[10px] px-1.5 py-0.5"
                      style={{ backgroundColor: tag.tag_bg, color: tag.tag_fg }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* My notes */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">My Notes</label>
                <textarea
                  className="w-full text-sm border rounded-md p-2 min-h-[80px] resize-y bg-background"
                  placeholder="Add your own notes about this task..."
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={savingNotes || detailNotes === (dismissals[detailTask.task.id]?.notes || "")}
                    onClick={() => handleSaveNotes(detailTask.task.id, detailNotes)}
                  >
                    {savingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  {detailTask.task.url && (
                    <a
                      href={detailTask.task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open in ClickUp
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={addedIds.has(detailTask.task.id)}
                    onClick={() => {
                      openAddDialog(detailTask.task, detailTask.teamId);
                      setDetailTask(null);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {addedIds.has(detailTask.task.id) ? "Already Added" : "Add to MyTime"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => handleDismiss(detailTask.task.id, "dismissed")}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => handleDismiss(detailTask.task.id, "ignored")}
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Ignore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDismiss(detailTask.task.id, "deleted")}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete from Triage
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add task dialog */}
      <Dialog open={!!addingTask} onOpenChange={(open) => !open && setAddingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to MyTime Tasks</DialogTitle>
            <DialogDescription>
              Create a task from &ldquo;{addingTask?.name}&rdquo; — choose which client and project it belongs to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Client</label>
              <Select value={addClientId} onValueChange={(v) => { setAddClientId(v); setAddProjectId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Project</label>
              <Select value={addProjectId} onValueChange={setAddProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {clientProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addingTask && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded space-y-1">
                <div><strong>Priority:</strong> {addingTask.priority?.priority || "None"} → {mapPriorityLabel(addingTask.priority?.id)}</div>
                <div><strong>Status:</strong> {addingTask.status.status} → Backlog</div>
                {addingTask.url && (
                  <div><strong>URL:</strong> <a href={addingTask.url} target="_blank" rel="noopener noreferrer" className="underline">ClickUp link</a></div>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddingTask(null)}>Cancel</Button>
              <Button onClick={handleAddTask} disabled={!addClientId || !addProjectId || addingInProgress}>
                <Plus className="h-4 w-4 mr-1" />
                {addingInProgress ? "Adding..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mapPriorityLabel(clickupPriorityId: number | undefined): string {
  switch (clickupPriorityId) {
    case 1:
    case 2:
      return "P1 (High)";
    case 3:
      return "P2 (Medium)";
    case 4:
      return "P3 (Low)";
    default:
      return "P2 (Medium)";
  }
}
