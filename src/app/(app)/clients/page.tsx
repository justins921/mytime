"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, ChevronRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  tags: string;
  weight: number;
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

const COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#84cc16",
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [newName, setNewName] = useState("");
  const [newRetainer, setNewRetainer] = useState("2000");
  const [newRate, setNewRate] = useState("50");
  const [newTarget, setNewTarget] = useState("10");
  const [newStyle, setNewStyle] = useState("DeepWork");
  const [newDailyTouch, setNewDailyTouch] = useState(false);
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  async function addClient() {
    if (!newName.trim()) return;
    const retainer = parseFloat(newRetainer) || 2000;
    const rate = parseFloat(newRate) || 50;
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        retainerMonthly: retainer,
        baselineRateHourly: rate,
        weeklyTargetHours: parseFloat(newTarget) || 10,
        monthlyCapHours: retainer / rate,
        style: newStyle,
        dailyTouch: newDailyTouch,
        color: newColor,
      }),
    });
    if (res.ok) {
      const client = await res.json();
      setClients((prev) => [...prev, { ...client, projects: [] }]);
      setNewName("");
    }
  }

  async function deleteClient(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Clients</h2>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Client name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Monthly Retainer ($)</Label>
                  <Input type="number" value={newRetainer} onChange={(e) => setNewRetainer(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Weekly Target Hours</Label>
                <Input type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={newStyle} onValueChange={setNewStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DeepWork">Deep Work</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newDailyTouch} onCheckedChange={setNewDailyTouch} />
                <Label>Daily touch required</Label>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
              </div>
              <DialogClose asChild>
                <Button onClick={addClient} className="w-full">Add Client</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color }} />
                  <span className="text-base">{client.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{client.style}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Retainer:</span>{" "}
                  <span className="font-medium">${client.retainerMonthly}/mo</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate:</span>{" "}
                  <span className="font-medium">${client.baselineRateHourly}/hr</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weekly:</span>{" "}
                  <span className="font-medium">{client.weeklyTargetHours}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cap:</span>{" "}
                  <span className="font-medium">{client.monthlyCapHours}h/mo</span>
                </div>
              </div>
              {client.dailyTouch && (
                <Badge variant="outline" className="text-xs">Daily touch</Badge>
              )}
              <div className="text-xs text-muted-foreground">
                {client.projects.length} project{client.projects.length !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Link href={`/clients/${client.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Manage <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={() => deleteClient(client.id)}
                >
                  Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
