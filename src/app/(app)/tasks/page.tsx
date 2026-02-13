"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Plus, Trash2, List, Columns3, GripVertical } from "lucide-react";

interface Client {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  client: Client;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: string;
  estimateMinutes: number | null;
  dueDate: string | null;
  status: string;
  url: string;
  tags: string;
  project: Project;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-red-100 text-red-800",
  P2: "bg-yellow-100 text-yellow-800",
  P3: "bg-green-100 text-green-800",
};

const COLUMNS = [
  { key: "Backlog", label: "Backlog" },
  { key: "InProgress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick add form
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("P2");
  const [newEstimate, setNewEstimate] = useState("");

  // Filter & view
  const [filterClient, setFilterClient] = useState("all");
  const [tab, setTab] = useState("Backlog");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  // Drag state for kanban
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  // Inline create
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([t, c, p]) => {
      setTasks(t);
      setClients(c);
      setProjects(p);
      if (c.length > 0) setSelectedClientId(c[0].id);
      setLoading(false);
    });
  }, []);

  const clientProjects = projects.filter((p) => p.clientId === selectedClientId);

  useEffect(() => {
    if (clientProjects.length > 0 && !clientProjects.find((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(clientProjects[0].id);
    }
  }, [selectedClientId, clientProjects, selectedProjectId]);

  async function addTask() {
    if (!newTitle.trim() || !selectedProjectId) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProjectId,
        title: newTitle,
        priority: newPriority,
        estimateMinutes: newEstimate ? parseInt(newEstimate) : null,
      }),
    });
    if (res.ok) {
      const allTasks = await fetch("/api/tasks").then((r) => r.json());
      setTasks(allTasks);
      setNewTitle("");
      setNewEstimate("");
    }
  }

  async function updateStatus(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  const clientFilteredTasks = tasks.filter((t) => {
    if (filterClient !== "all" && t.project.clientId !== filterClient) return false;
    return true;
  });

  const filteredTasks = clientFilteredTasks.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    return true;
  });

  function handleClientChange(value: string) {
    if (value === "__create__") {
      setNewClientName("");
      setShowCreateClient(true);
      return;
    }
    setSelectedClientId(value);
  }

  function handleProjectChange(value: string) {
    if (value === "__create__") {
      setNewProjectName("");
      setShowCreateProject(true);
      return;
    }
    setSelectedProjectId(value);
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
      setSelectedClientId(client.id);
      setShowCreateClient(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim() || !selectedClientId) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: selectedClientId, name: newProjectName.trim() }),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects((prev) => [...prev, project]);
      setSelectedProjectId(project.id);
      setShowCreateProject(false);
    }
  }

  function handleDragStart(taskId: string) {
    setDragTaskId(taskId);
  }

  function handleDrop(targetStatus: string) {
    if (dragTaskId) {
      updateStatus(dragTaskId, targetStatus);
      setDragTaskId(null);
    }
  }

  function TaskCard({ task, compact }: { task: Task; compact?: boolean }) {
    return (
      <Card className={`${dragTaskId === task.id ? "opacity-50" : ""}`}>
        <CardContent className={compact ? "py-2 px-3" : "py-3 px-4"}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {compact && (
                  <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                )}
                <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{task.title}</span>
                <Badge className={`text-[10px] px-1 py-0 ${PRIORITY_COLORS[task.priority] || ""}`}>
                  {task.priority}
                </Badge>
                {task.tags && task.tags.split(",").map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{tag.trim()}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span style={{ color: task.project.client.color }}>{task.project.client.name}</span>
                <span>/</span>
                <span>{task.project.name}</span>
                {task.estimateMinutes && <span>({task.estimateMinutes}min)</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!compact && (
                <Select
                  value={task.status}
                  onValueChange={(v) => updateStatus(task.id, v)}
                >
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="InProgress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTask(task.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Tasks</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => setViewMode("board")}
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Quick Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Add Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Client</Label>
                  <Select value={selectedClientId} onValueChange={handleClientChange}>
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
                  <Label>Project</Label>
                  <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {clientProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {selectedClientId && <SelectItem value="__create__" className="text-primary font-medium">+ New Project</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1 - High</SelectItem>
                        <SelectItem value="P2">P2 - Medium</SelectItem>
                        <SelectItem value="P3">P3 - Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Estimate (min)</Label>
                    <Input type="number" value={newEstimate} onChange={(e) => setNewEstimate(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <DialogClose asChild>
                  <Button onClick={addTask} className="w-full">Add Task</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter by client */}
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Filter:</Label>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "list" ? (
        /* List view with tabs */
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="Backlog">Backlog</TabsTrigger>
            <TabsTrigger value="InProgress">In Progress</TabsTrigger>
            <TabsTrigger value="Done">Done</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No tasks</p>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Board / Kanban view */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const columnTasks = clientFilteredTasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="space-y-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
              >
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {col.label}
                      <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <div className="space-y-2 min-h-[100px]">
                  {columnTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Drag tasks here</p>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={() => setDragTaskId(null)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <TaskCard task={task} compact />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
