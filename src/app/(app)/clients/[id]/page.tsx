"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Project {
  id: string;
  name: string;
  tags: string;
  weight: number;
  tasks: Task[];
}

interface Client {
  id: string;
  name: string;
  retainerMonthly: number;
  baselineRateHourly: number;
  weeklyTargetHours: number;
  monthlyCapHours: number;
  priorityWeight: number;
  style: string;
  dailyTouch: boolean;
  color: string;
  projects: Project[];
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTags, setNewProjectTags] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data);
        setForm(data);
      });
  }, [id]);

  async function saveClient() {
    if (!client) return;
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        retainerMonthly: form.retainerMonthly,
        baselineRateHourly: form.baselineRateHourly,
        weeklyTargetHours: form.weeklyTargetHours,
        monthlyCapHours: form.monthlyCapHours,
        priorityWeight: form.priorityWeight,
        style: form.style,
        dailyTouch: form.dailyTouch,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setClient({ ...client, ...updated });
      setEditing(false);
    }
  }

  async function addProject() {
    if (!newProjectName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: id,
        name: newProjectName,
        tags: newProjectTags,
      }),
    });
    if (res.ok) {
      const project = await res.json();
      setClient((prev) =>
        prev ? { ...prev, projects: [...prev.projects, { ...project, tasks: [] }] } : prev
      );
      setNewProjectName("");
      setNewProjectTags("");
    }
  }

  async function deleteProject(pid: string) {
    await fetch(`/api/projects/${pid}`, { method: "DELETE" });
    setClient((prev) =>
      prev ? { ...prev, projects: prev.projects.filter((p) => p.id !== pid) } : prev
    );
  }

  if (!client) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/clients">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: client.color }} />
          <h2 className="text-xl font-semibold">{client.name}</h2>
        </div>
      </div>

      {/* Client details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Client Details</CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveClient}><Save className="h-3 w-3 mr-1" /> Save</Button>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm(client); }}>Cancel</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Style</Label>
                <Select value={form.style || "DeepWork"} onValueChange={(v) => setForm({ ...form, style: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DeepWork">Deep Work</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monthly Retainer ($)</Label>
                <Input type="number" value={form.retainerMonthly || ""} onChange={(e) => setForm({ ...form, retainerMonthly: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hourly Rate ($)</Label>
                <Input type="number" value={form.baselineRateHourly || ""} onChange={(e) => setForm({ ...form, baselineRateHourly: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Weekly Target (hours)</Label>
                <Input type="number" value={form.weeklyTargetHours || ""} onChange={(e) => setForm({ ...form, weeklyTargetHours: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monthly Cap (hours)</Label>
                <Input type="number" value={form.monthlyCapHours || ""} onChange={(e) => setForm({ ...form, monthlyCapHours: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Priority Weight</Label>
                <Input type="number" value={form.priorityWeight || ""} onChange={(e) => setForm({ ...form, priorityWeight: parseFloat(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.dailyTouch || false} onCheckedChange={(v) => setForm({ ...form, dailyTouch: v })} />
                <Label className="text-xs">Daily touch required</Label>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <div><span className="text-muted-foreground">Retainer:</span> ${client.retainerMonthly}/mo</div>
              <div><span className="text-muted-foreground">Rate:</span> ${client.baselineRateHourly}/hr</div>
              <div><span className="text-muted-foreground">Weekly Target:</span> {client.weeklyTargetHours}h</div>
              <div><span className="text-muted-foreground">Monthly Cap:</span> {client.monthlyCapHours}h</div>
              <div><span className="text-muted-foreground">Priority:</span> {client.priorityWeight}</div>
              <div><span className="text-muted-foreground">Style:</span> {client.style}</div>
              {client.dailyTouch && <Badge variant="outline" className="w-fit">Daily touch</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Projects</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Project Name</Label>
                  <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name" />
                </div>
                <div className="space-y-1">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={newProjectTags} onChange={(e) => setNewProjectTags(e.target.value)} placeholder="e.g., UC30" />
                </div>
                <DialogClose asChild>
                  <Button onClick={addProject} className="w-full">Add Project</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {client.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {client.projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <span className="font-medium text-sm">{project.name}</span>
                    {project.tags && (
                      <Badge variant="secondary" className="ml-2 text-xs">{project.tags}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteProject(project.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
