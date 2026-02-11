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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Plus, Trash2 } from "lucide-react";

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

  // Filter
  const [filterClient, setFilterClient] = useState("all");
  const [tab, setTab] = useState("Backlog");

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
      const task = await res.json();
      // Refetch tasks for full relations
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

  const filteredTasks = tasks.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (filterClient !== "all" && t.project.clientId !== filterClient) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Tasks</h2>
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
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {clientProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
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

      {/* Tabs */}
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
                <Card key={task.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{task.title}</span>
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
