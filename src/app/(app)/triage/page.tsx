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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Unified triage item that works across all sources
interface TriageItem {
  id: string;        // unique ID within the source
  triageId: string;  // globally unique: source_id (used for dismissals)
  source: "clickup" | "trello" | "asana" | "monday";
  name: string;
  description: string;
  url: string;
  dueDate: Date | null;
  updatedAt: Date;
  createdAt: Date;
  status: string;
  priority: string | null;
  priorityLevel: number; // 1=urgent, 2=high, 3=normal, 4=low
  workspace: string;
  workspaceId: string;
  location: string;  // folder/list or project/board
  assignees: string[];
  tags: { name: string; color?: string; bgColor?: string }[];
  rawData: unknown;  // original source data for the add-to-mytime POST
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
  [teamId: string]: string;
}

interface TriageDismissal {
  id: string;
  clickupTaskId: string;
  action: string;
  notes: string;
}

type SourceType = "all" | "clickup" | "trello" | "asana" | "monday";

const SOURCE_LABELS: Record<string, string> = {
  all: "All Sources",
  clickup: "ClickUp",
  trello: "Trello",
  asana: "Asana",
  monday: "Monday.com",
};

const AUTO_REFRESH_MS = 30 * 60 * 1000;

function isWithinWorkHours(): boolean {
  const nowCentral = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const hours = nowCentral.getHours();
  const minutes = nowCentral.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  return timeInMinutes >= 540 && timeInMinutes < 930;
}

export default function TriagePage() {
  const [triageItems, setTriageItems] = useState<TriageItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workspaceMap, setWorkspaceMap] = useState<WorkspaceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configuredSources, setConfiguredSources] = useState<Set<SourceType>>(new Set());

  // Dismissals
  const [dismissals, setDismissals] = useState<Record<string, TriageDismissal>>({});

  // Add-to-tasks dialog
  const [addingItem, setAddingItem] = useState<TriageItem | null>(null);
  const [addClientId, setAddClientId] = useState("");
  const [addProjectId, setAddProjectId] = useState("");
  const [addingInProgress, setAddingInProgress] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Task detail dialog
  const [detailItem, setDetailItem] = useState<TriageItem | null>(null);
  const [detailNotes, setDetailNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Inline create
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Filters
  const [filterSource, setFilterSource] = useState<SourceType>("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterDue, setFilterDue] = useState("all");

  // Auto-refresh
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Imported task IDs (already in MyTime)
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const loadImportedIds = useCallback(async () => {
    try {
      const ids: string[] = await fetch("/api/tasks?clickupIds=true").then((r) => r.json());
      setImportedIds(new Set(ids));
    } catch {
      // ignore
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const data = await fetch("/api/clients").then((r) => r.json());
      setClients(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await fetch("/api/settings").then((r) => r.json());
      const sources = new Set<SourceType>();
      if (data.clickupApiToken) sources.add("clickup");
      if (data.trelloApiToken) sources.add("trello");
      if (data.asanaApiToken) sources.add("asana");
      if (data.mondayApiToken) sources.add("monday");
      setConfiguredSources(sources);
      let map: Record<string, string> = {};
      try { map = JSON.parse(data.clickupWorkspaceMapJson || "{}"); } catch { /* ignore corrupt json */ }
      setWorkspaceMap(map);
    } catch {
      // ignore
    }
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

  // Normalize ClickUp tasks into TriageItems
  function normalizeClickUp(data: { teams: { id: string; name: string }[]; tasksByTeam: Record<string, ClickUpRaw[]> }): TriageItem[] {
    const items: TriageItem[] = [];
    for (const team of data.teams || []) {
      for (const t of data.tasksByTeam[team.id] || []) {
        items.push({
          id: t.id,
          triageId: t.id, // ClickUp uses raw ID for backwards compat
          source: "clickup",
          name: t.name,
          description: t.description || "",
          url: t.url || "",
          dueDate: t.due_date ? new Date(parseInt(t.due_date)) : null,
          updatedAt: new Date(parseInt(t.date_updated)),
          createdAt: new Date(parseInt(t.date_created)),
          status: t.status?.status || "",
          priority: t.priority?.priority || null,
          priorityLevel: t.priority?.id || 3,
          workspace: team.name,
          workspaceId: team.id,
          location: `${t.folder?.name || ""} / ${t.list?.name || ""}`,
          assignees: t.assignees?.map((a: { username: string }) => a.username) || [],
          tags: t.tags?.map((tag: { name: string; tag_fg: string; tag_bg: string }) => ({
            name: tag.name,
            color: tag.tag_fg,
            bgColor: tag.tag_bg,
          })) || [],
          rawData: t,
        });
      }
    }
    return items;
  }

  // Normalize Trello cards
  function normalizeTrello(data: { boards: { id: string; name: string }[]; cardsByBoard: Record<string, TrelloRaw[]> }): TriageItem[] {
    const items: TriageItem[] = [];
    for (const board of data.boards || []) {
      for (const card of data.cardsByBoard[board.id] || []) {
        items.push({
          id: card.id,
          triageId: `trello_${card.id}`,
          source: "trello",
          name: card.name,
          description: card.desc || "",
          url: card.url || "",
          dueDate: card.due ? new Date(card.due) : null,
          updatedAt: new Date(card.dateLastActivity),
          createdAt: new Date(card.dateLastActivity),
          status: "",
          priority: null,
          priorityLevel: 3,
          workspace: board.name,
          workspaceId: board.id,
          location: card.board?.name || board.name,
          assignees: [],
          tags: card.labels?.map((l: { name: string; color: string }) => ({
            name: l.name || l.color,
            bgColor: labelColorMap[l.color] || "#e2e8f0",
            color: "#1e293b",
          })) || [],
          rawData: card,
        });
      }
    }
    return items;
  }

  // Normalize Asana tasks
  function normalizeAsana(data: { workspaces: { id: string; name: string }[]; tasksByWorkspace: Record<string, AsanaRaw[]> }): TriageItem[] {
    const items: TriageItem[] = [];
    for (const ws of data.workspaces || []) {
      for (const t of data.tasksByWorkspace[ws.id] || []) {
        items.push({
          id: t.gid,
          triageId: `asana_${t.gid}`,
          source: "asana",
          name: t.name,
          description: t.notes || "",
          url: t.permalink_url || "",
          dueDate: t.due_on ? new Date(t.due_on) : null,
          updatedAt: new Date(t.modified_at),
          createdAt: new Date(t.created_at),
          status: t.completed ? "Completed" : "Active",
          priority: null,
          priorityLevel: 3,
          workspace: ws.name,
          workspaceId: ws.id,
          location: t.projects?.map((p: { name: string }) => p.name).join(", ") || "",
          assignees: [],
          tags: t.tags?.map((tag: { name: string }) => ({
            name: tag.name,
            bgColor: "#e2e8f0",
            color: "#1e293b",
          })) || [],
          rawData: t,
        });
      }
    }
    return items;
  }

  // Normalize Monday.com items
  function normalizeMonday(data: { boards: { id: string; name: string }[]; itemsByBoard: Record<string, MondayRaw[]> }): TriageItem[] {
    const items: TriageItem[] = [];
    for (const board of data.boards || []) {
      for (const item of data.itemsByBoard[board.id] || []) {
        let dueDate: Date | null = null;
        for (const cv of item.column_values || []) {
          if (cv.title?.toLowerCase().includes("date") && cv.text) {
            const d = new Date(cv.text);
            if (!isNaN(d.getTime())) { dueDate = d; break; }
          }
        }
        items.push({
          id: item.id,
          triageId: `monday_${item.id}`,
          source: "monday",
          name: item.name,
          description: "",
          url: item.url || "",
          dueDate,
          updatedAt: new Date(item.updated_at),
          createdAt: new Date(item.created_at),
          status: item.state || "",
          priority: null,
          priorityLevel: 3,
          workspace: board.name,
          workspaceId: board.id,
          location: item.group?.title || "",
          assignees: [],
          tags: [],
          rawData: item,
        });
      }
    }
    return items;
  }

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    const allItems: TriageItem[] = [];
    const allTeams: Team[] = [];
    const errors: string[] = [];

    // Fetch from all configured sources in parallel
    const promises: Promise<void>[] = [];

    if (configuredSources.has("clickup")) {
      promises.push(
        fetch("/api/clickup?action=tasks")
          .then((r) => r.json())
          .then((data) => {
            if (data.error) { errors.push(`ClickUp: ${data.error}`); return; }
            allItems.push(...normalizeClickUp(data));
            allTeams.push(...(data.teams || []));
          })
          .catch(() => { errors.push("Failed to connect to ClickUp"); })
      );
    }

    if (configuredSources.has("trello")) {
      promises.push(
        fetch("/api/trello?action=tasks")
          .then((r) => r.json())
          .then((data) => {
            if (data.error) { errors.push(`Trello: ${data.error}`); return; }
            allItems.push(...normalizeTrello(data));
          })
          .catch(() => { errors.push("Failed to connect to Trello"); })
      );
    }

    if (configuredSources.has("asana")) {
      promises.push(
        fetch("/api/asana?action=tasks")
          .then((r) => r.json())
          .then((data) => {
            if (data.error) { errors.push(`Asana: ${data.error}`); return; }
            allItems.push(...normalizeAsana(data));
          })
          .catch(() => { errors.push("Failed to connect to Asana"); })
      );
    }

    if (configuredSources.has("monday")) {
      promises.push(
        fetch("/api/monday?action=tasks")
          .then((r) => r.json())
          .then((data) => {
            if (data.error) { errors.push(`Monday.com: ${data.error}`); return; }
            allItems.push(...normalizeMonday(data));
          })
          .catch(() => { errors.push("Failed to connect to Monday.com"); })
      );
    }

    await Promise.all(promises);

    setTriageItems(allItems);
    setTeams(allTeams);
    if (errors.length > 0) setError(errors.join(". "));
    setLastRefresh(new Date());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuredSources]);

  // Initial load
  useEffect(() => {
    loadClients();
    loadSettings();
    loadDismissals();
    loadImportedIds();
  }, [loadClients, loadSettings, loadDismissals, loadImportedIds]);

  useEffect(() => {
    if (configuredSources.size > 0) {
      fetchAllTasks();
    }
  }, [configuredSources, fetchAllTasks]);

  // Auto-refresh
  useEffect(() => {
    function scheduleCheck() {
      if (isWithinWorkHours() && configuredSources.size > 0) {
        fetchAllTasks();
        loadDismissals();
        setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
      } else {
        setNextRefresh(null);
      }
    }

    intervalRef.current = setInterval(scheduleCheck, AUTO_REFRESH_MS);
    if (isWithinWorkHours()) {
      setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAllTasks, loadDismissals, configuredSources]);

  function handleManualRefresh() {
    fetchAllTasks();
    loadDismissals();
    if (isWithinWorkHours()) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
      intervalRef.current = setInterval(() => {
        if (isWithinWorkHours()) {
          fetchAllTasks();
          loadDismissals();
          setNextRefresh(new Date(Date.now() + AUTO_REFRESH_MS));
        } else {
          setNextRefresh(null);
        }
      }, AUTO_REFRESH_MS);
    }
  }

  function openAddDialog(item: TriageItem) {
    setAddingItem(item);
    const mappedClientId = workspaceMap[item.workspaceId] || "";
    setAddClientId(mappedClientId);
    setAddProjectId("");
  }

  async function handleAddTask() {
    if (!addingItem || !addClientId || !addProjectId) return;
    setAddingInProgress(true);
    try {
      let apiUrl: string;
      let body: unknown;

      switch (addingItem.source) {
        case "clickup":
          apiUrl = "/api/clickup";
          body = { clickupTask: addingItem.rawData, clientId: addClientId, projectId: addProjectId };
          break;
        case "trello":
          apiUrl = "/api/trello";
          body = { trelloCard: addingItem.rawData, clientId: addClientId, projectId: addProjectId };
          break;
        case "asana":
          apiUrl = "/api/asana";
          body = { asanaTask: addingItem.rawData, clientId: addClientId, projectId: addProjectId };
          break;
        case "monday":
          apiUrl = "/api/monday";
          body = { mondayItem: addingItem.rawData, clientId: addClientId, projectId: addProjectId };
          break;
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAddedIds((prev) => new Set(prev).add(addingItem.triageId));
        setImportedIds((prev) => new Set(prev).add(addingItem.triageId));
        setDismissals((prev) => ({
          ...prev,
          [addingItem.triageId]: { id: "", clickupTaskId: addingItem.triageId, action: "added", notes: prev[addingItem.triageId]?.notes || "" },
        }));
        setAddingItem(null);
      }
    } catch {
      // ignore
    }
    setAddingInProgress(false);
  }

  async function handleDismiss(triageId: string, action: string) {
    try {
      await fetch("/api/triage-dismissals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickupTaskId: triageId, action }),
      });
      setDismissals((prev) => ({
        ...prev,
        [triageId]: { id: "", clickupTaskId: triageId, action, notes: prev[triageId]?.notes || "" },
      }));
      setDetailItem(null);
    } catch {
      // ignore
    }
  }

  async function handleSaveNotes(triageId: string, notes: string) {
    setSavingNotes(true);
    try {
      await fetch("/api/triage-dismissals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickupTaskId: triageId, notes }),
      });
      setDismissals((prev) => ({
        ...prev,
        [triageId]: { ...(prev[triageId] || { id: "", clickupTaskId: triageId, action: "noted" }), notes },
      }));
    } catch {
      // ignore
    }
    setSavingNotes(false);
  }

  function handleAddClientChange(value: string) {
    if (value === "__create__") {
      setNewClientName("");
      setShowCreateClient(true);
      return;
    }
    setAddClientId(value);
    setAddProjectId("");
  }

  function handleAddProjectChange(value: string) {
    if (value === "__create__") {
      setNewProjectName("");
      setShowCreateProject(true);
      return;
    }
    setAddProjectId(value);
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
      setClients((prev) => [...prev, { ...client, projects: [] }]);
      setAddClientId(client.id);
      setAddProjectId("");
      setShowCreateClient(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim() || !addClientId) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: addClientId, name: newProjectName.trim() }),
    });
    if (res.ok) {
      const project = await res.json();
      setClients((prev) =>
        prev.map((c) =>
          c.id === addClientId ? { ...c, projects: [...c.projects, { id: project.id, name: project.name }] } : c
        )
      );
      setAddProjectId(project.id);
      setShowCreateProject(false);
    }
  }

  const selectedClient = clients.find((c) => c.id === addClientId);
  const clientProjects = selectedClient?.projects || [];

  // Filter and sort items
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const allFilteredItems: TriageItem[] = [];
  for (const item of triageItems) {
    // Source filter
    if (filterSource !== "all" && filterSource !== item.source) continue;
    // Workspace filter
    if (filterTeam !== "all" && filterTeam !== item.workspaceId) continue;
    // Skip dismissed/ignored/deleted/added
    const d = dismissals[item.triageId];
    if (d && d.action !== "noted") continue;
    // Skip already imported
    if (importedIds.has(item.triageId)) continue;

    if (filterDue !== "all") {
      if (!item.dueDate) continue;
      const due = item.dueDate;
      if (filterDue === "today" && due > todayEnd) continue;
      if (filterDue === "week" && due > weekEnd) continue;
      if (filterDue === "month" && due > monthEnd) continue;
    }
    allFilteredItems.push(item);
  }

  // Sort: due date first (overdue/soonest), then updated
  allFilteredItems.sort((a, b) => {
    const aDue = a.dueDate?.getTime() ?? Infinity;
    const bDue = b.dueDate?.getTime() ?? Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const dismissedCount = Object.values(dismissals).filter(
    (d) => d.action !== "noted"
  ).length + [...importedIds].filter((id) => !dismissals[id]).length;

  // Get unique workspaces across all current items for the filter
  const allWorkspaces = Array.from(
    new Map(triageItems.map((item) => [item.workspaceId, { id: item.workspaceId, name: item.workspace }])).values()
  );

  function sourceBadge(source: TriageItem["source"]) {
    const colors: Record<string, string> = {
      clickup: "bg-purple-100 text-purple-800",
      trello: "bg-blue-100 text-blue-800",
      asana: "bg-orange-100 text-orange-800",
      monday: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={`text-[10px] ${colors[source] || ""}`}>
        {SOURCE_LABELS[source]}
      </Badge>
    );
  }

  function priorityBadge(item: TriageItem) {
    if (!item.priority) return null;
    const colors: Record<number, string> = {
      1: "bg-red-100 text-red-800",
      2: "bg-orange-100 text-orange-800",
      3: "bg-yellow-100 text-yellow-800",
      4: "bg-blue-100 text-blue-800",
    };
    return (
      <Badge className={`text-[10px] ${colors[item.priorityLevel] || ""}`}>
        {item.priority}
      </Badge>
    );
  }

  function dueDateBadge(dueDate: Date | null) {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDay = new Date(dueDate);
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
      label = `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
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

  function formatUpdated(date: Date) {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString("en-US", {
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

  if (configuredSources.size === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Triage</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <div>
                <h3 className="font-medium">Connect a task management tool</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  Pull tasks from your existing tools into a unified triage queue.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <button onClick={() => window.location.href = "/settings"} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-colors text-left">
                  <Inbox className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><div className="text-sm font-medium">ClickUp</div><div className="text-[10px] text-muted-foreground">API token</div></div>
                </button>
                <button onClick={() => window.location.href = "/settings"} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-colors text-left">
                  <Inbox className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><div className="text-sm font-medium">Trello</div><div className="text-[10px] text-muted-foreground">API key:token</div></div>
                </button>
                <button onClick={() => window.location.href = "/settings"} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-colors text-left">
                  <Inbox className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><div className="text-sm font-medium">Asana</div><div className="text-[10px] text-muted-foreground">Access token</div></div>
                </button>
                <button onClick={() => window.location.href = "/settings"} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-colors text-left">
                  <Inbox className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><div className="text-sm font-medium">Monday.com</div><div className="text-[10px] text-muted-foreground">API token</div></div>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Token-based integrations are configured in Settings.</p>
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
          <h2 className="text-xl font-semibold">Triage</h2>
          <Badge variant="secondary" className="ml-2">
            {allFilteredItems.length} tasks
          </Badge>
          {dismissedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({dismissedCount} hidden)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {configuredSources.size > 1 && (
            <Select value={filterSource} onValueChange={(v) => setFilterSource(v as SourceType)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {[...configuredSources].map((s) => (
                  <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          {allWorkspaces.length > 1 && (
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspaces</SelectItem>
                {allWorkspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
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

      {/* Source badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {[...configuredSources].map((s) => {
          const count = triageItems.filter((i) => i.source === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterSource(filterSource === s ? "all" : s)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filterSource === s
                  ? "ring-2 ring-primary ring-offset-1"
                  : "hover:opacity-80"
              } ${
                s === "clickup" ? "bg-purple-100 text-purple-800" :
                s === "trello" ? "bg-blue-100 text-blue-800" :
                s === "asana" ? "bg-orange-100 text-orange-800" :
                "bg-red-100 text-red-800"
              }`}
            >
              {SOURCE_LABELS[s]}
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Auto-refresh status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {lastRefresh && <span>Last refreshed {formatRefreshTime(lastRefresh)}</span>}
        {nextRefresh ? (
          <span>&middot; Next auto-refresh ~{formatRefreshTime(nextRefresh)}</span>
        ) : (
          <span>&middot; Auto-refresh active 9 AM &ndash; 3:30 PM CT</span>
        )}
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && allFilteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          Fetching tasks...
        </div>
      ) : allFilteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No tasks found. Tasks assigned to you will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allFilteredItems.map((item) => {
            const isAdded = addedIds.has(item.triageId);
            const hasNotes = !!dismissals[item.triageId]?.notes;
            return (
              <Card
                key={item.triageId}
                className={`${isAdded ? "opacity-50" : "hover:border-primary/40 cursor-pointer"} transition-colors`}
                onClick={() => {
                  setDetailItem(item);
                  setDetailNotes(dismissals[item.triageId]?.notes || "");
                }}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{item.name}</span>
                        {sourceBadge(item.source)}
                        {priorityBadge(item)}
                        {item.status && (
                          <Badge variant="outline" className="text-[10px]">
                            {item.status}
                          </Badge>
                        )}
                        {dueDateBadge(item.dueDate)}
                        {hasNotes && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Has notes
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium">{item.workspace}</span>
                        {item.location && (
                          <>
                            <span>&middot;</span>
                            <span>{item.location}</span>
                          </>
                        )}
                        {item.assignees.length > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>{item.assignees.join(", ")}</span>
                          </>
                        )}
                        <span>&middot;</span>
                        <span>Updated {formatUpdated(item.updatedAt)}</span>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag.name}
                              className="text-[10px] px-1 py-0"
                              style={{ backgroundColor: tag.bgColor, color: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-muted rounded"
                          title={`Open in ${SOURCE_LABELS[item.source]}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddDialog(item)}
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
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug pr-6">
              {detailItem?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Task details and actions
            </DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              {/* Meta badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {sourceBadge(detailItem.source)}
                {priorityBadge(detailItem)}
                {detailItem.status && (
                  <Badge variant="outline" className="text-[10px]">
                    {detailItem.status}
                  </Badge>
                )}
                {dueDateBadge(detailItem.dueDate)}
              </div>

              {/* Description */}
              {detailItem.description && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded p-3 max-h-40 overflow-auto">
                    {detailItem.description}
                  </p>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Workspace</span>
                  <p className="font-medium">{detailItem.workspace}</p>
                </div>
                {detailItem.location && (
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium">{detailItem.location}</p>
                  </div>
                )}
                {detailItem.assignees.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Assignees</span>
                    <p className="font-medium">{detailItem.assignees.join(", ")}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">{formatDate(detailItem.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated</span>
                  <p className="font-medium">{formatDate(detailItem.updatedAt)}</p>
                </div>
                {detailItem.dueDate && (
                  <div>
                    <span className="text-muted-foreground">Due date</span>
                    <p className="font-medium">{formatDate(detailItem.dueDate)}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {detailItem.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {detailItem.tags.map((tag) => (
                    <Badge
                      key={tag.name}
                      className="text-[10px] px-1.5 py-0.5"
                      style={{ backgroundColor: tag.bgColor, color: tag.color }}
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
                    disabled={savingNotes || detailNotes === (dismissals[detailItem.triageId]?.notes || "")}
                    onClick={() => handleSaveNotes(detailItem.triageId, detailNotes)}
                  >
                    {savingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  {detailItem.url && (
                    <a
                      href={detailItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open in {SOURCE_LABELS[detailItem.source]}
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={addedIds.has(detailItem.triageId)}
                    onClick={() => {
                      openAddDialog(detailItem);
                      setDetailItem(null);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {addedIds.has(detailItem.triageId) ? "Already Added" : "Add to MyTime"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => handleDismiss(detailItem.triageId, "dismissed")}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => handleDismiss(detailItem.triageId, "ignored")}
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Ignore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDismiss(detailItem.triageId, "deleted")}
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
      <Dialog open={!!addingItem} onOpenChange={(open) => !open && setAddingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to MyTime Tasks</DialogTitle>
            <DialogDescription>
              Create a task from &ldquo;{addingItem?.name}&rdquo; &mdash; choose which client and project it belongs to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Client</label>
              <Select value={addClientId} onValueChange={handleAddClientChange}>
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
              <label className="text-xs font-medium">Project</label>
              <Select value={addProjectId} onValueChange={handleAddProjectChange}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {clientProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {addClientId && <SelectItem value="__create__" className="text-primary font-medium">+ New Project</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {addingItem && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded space-y-1">
                <div><strong>Source:</strong> {SOURCE_LABELS[addingItem.source]}</div>
                {addingItem.priority && <div><strong>Priority:</strong> {addingItem.priority} &rarr; P2</div>}
                <div><strong>Status:</strong> {addingItem.status || "N/A"} &rarr; Backlog</div>
                {addingItem.url && (
                  <div><strong>URL:</strong> <a href={addingItem.url} target="_blank" rel="noopener noreferrer" className="underline">{SOURCE_LABELS[addingItem.source]} link</a></div>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddingItem(null)}>Cancel</Button>
              <Button onClick={handleAddTask} disabled={!addClientId || !addProjectId || addingInProgress}>
                <Plus className="h-4 w-4 mr-1" />
                {addingInProgress ? "Adding..." : "Create Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create client dialog */}
      <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Create a new client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Client Name</Label>
              <Input
                value={newClientName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewClientName(e.target.value)}
                placeholder="e.g. Acme Corp"
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && createClient()}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProjectName(e.target.value)}
                placeholder="e.g. Website Redesign"
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && createProject()}
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
    </div>
  );
}

// Raw source types for normalization
interface ClickUpRaw {
  id: string;
  name: string;
  description?: string;
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

interface TrelloRaw {
  id: string;
  name: string;
  desc: string;
  url: string;
  due: string | null;
  dateLastActivity: string;
  labels: { id: string; name: string; color: string }[];
  idBoard: string;
  board?: { name: string };
}

interface AsanaRaw {
  gid: string;
  name: string;
  notes: string;
  permalink_url: string;
  due_on: string | null;
  modified_at: string;
  created_at: string;
  completed: boolean;
  projects: { gid: string; name: string }[];
  tags: { gid: string; name: string }[];
}

interface MondayRaw {
  id: string;
  name: string;
  state: string;
  url: string;
  updated_at: string;
  created_at: string;
  column_values: { id: string; title: string; text: string; value: string | null }[];
  board: { id: string; name: string };
  group: { id: string; title: string };
}

// Trello label colors to hex
const labelColorMap: Record<string, string> = {
  green: "#61bd4f",
  yellow: "#f2d600",
  orange: "#ff9f1a",
  red: "#eb5a46",
  purple: "#c377e0",
  blue: "#0079bf",
  sky: "#00c2e0",
  lime: "#51e898",
  pink: "#ff78cb",
  black: "#344563",
};
