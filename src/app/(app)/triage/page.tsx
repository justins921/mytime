"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Inbox, RefreshCw, Plus, ExternalLink, AlertTriangle } from "lucide-react";

interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: { status: string; color: string };
  priority: { id: number; priority: string; color: string } | null;
  url: string;
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

export default function TriagePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasksByTeam, setTasksByTeam] = useState<Record<string, ClickUpTask[]>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [workspaceMap, setWorkspaceMap] = useState<WorkspaceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noToken, setNoToken] = useState(false);

  // Add-to-tasks dialog
  const [addingTask, setAddingTask] = useState<ClickUpTask | null>(null);
  const [addClientId, setAddClientId] = useState("");
  const [addProjectId, setAddProjectId] = useState("");
  const [addingInProgress, setAddingInProgress] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Filter
  const [filterTeam, setFilterTeam] = useState("all");

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
      }
    } catch {
      setError("Failed to connect to ClickUp");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
    loadSettings();
  }, [loadClients, loadSettings]);

  useEffect(() => {
    if (!noToken) {
      fetchTasks();
    }
  }, [noToken, fetchTasks]);

  function openAddDialog(task: ClickUpTask, teamId: string) {
    setAddingTask(task);
    // Pre-select client from workspace map
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

  const selectedClient = clients.find((c) => c.id === addClientId);
  const clientProjects = selectedClient?.projects || [];

  // Flatten and sort all tasks
  const allFilteredTasks: { task: ClickUpTask; teamId: string; teamName: string }[] = [];
  for (const team of teams) {
    if (filterTeam !== "all" && filterTeam !== team.id) continue;
    const tasks = tasksByTeam[team.id] || [];
    for (const task of tasks) {
      allFilteredTasks.push({ task, teamId: team.id, teamName: team.name });
    }
  }
  // Sort by date_updated descending
  allFilteredTasks.sort(
    (a, b) => parseInt(b.task.date_updated) - parseInt(a.task.date_updated)
  );

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
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" onClick={fetchTasks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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
            return (
              <Card key={`${teamId}-${task.id}`} className={isAdded ? "opacity-50" : ""}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{task.name}</span>
                        {priorityBadge(task.priority)}
                        <Badge variant="outline" className="text-[10px]">
                          {task.status.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium">{teamName}</span>
                        <span>&middot;</span>
                        <span>{task.folder?.name}</span>
                        <span>/</span>
                        <span>{task.list?.name}</span>
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
                    <div className="flex items-center gap-1 shrink-0">
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
