"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Client {
  id: string;
  name: string;
  color: string;
  isPersonal: boolean;
  projects: { id: string; name: string }[];
}

interface ActiveTimer {
  id: string;
  startAt: string;
  clientId: string;
  projectId: string | null;
  client: { id: string; name: string; color: string };
  project?: { name: string } | null;
  task?: { title: string } | null;
}

export function HeaderTimer() {
  const [active, setActive] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/timer?active=true");
      const data = await res.json();
      setActive(data || null);
    } catch {
      // ignore
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }, []);

  // Poll for active timer
  useEffect(() => {
    fetchActive();
    const poll = setInterval(fetchActive, 30_000);
    return () => clearInterval(poll);
  }, [fetchActive]);

  // Tick the elapsed counter
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (active) {
      function tick() {
        const diff = Math.floor(
          (Date.now() - new Date(active!.startAt).getTime()) / 1000
        );
        setElapsed(Math.max(0, diff));
      }
      tick();
      tickRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [active]);

  // Load clients when popover opens
  useEffect(() => {
    if (open && clients.length === 0) fetchClients();
  }, [open, clients.length, fetchClients]);

  function formatElapsed(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function startTimer() {
    if (!selectedClientId) return;
    setStarting(true);
    try {
      const res = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          projectId: selectedProjectId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActive(data);
        setOpen(false);
        setSelectedClientId("");
        setSelectedProjectId("");
      }
    } finally {
      setStarting(false);
    }
  }

  async function stopTimer() {
    if (!active) return;
    const res = await fetch("/api/timer/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active.id }),
    });
    if (res.ok) setActive(null);
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Active timer: show running state
  if (active) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: active.client.color || "#3b82f6" }}
        />
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium leading-tight">
            {active.client.name}
            {active.project ? (
              <span className="text-muted-foreground"> / {active.project.name}</span>
            ) : null}
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {formatElapsed(elapsed)}
          </div>
        </div>
        <div className="sm:hidden text-xs font-mono font-medium">
          {formatElapsed(elapsed)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={stopTimer}
          title="Stop timer"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>
    );
  }

  // No active timer: show start button with popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Start timer"
        >
          <Play className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="space-y-3">
          <p className="text-xs font-medium">Quick Start Timer</p>
          <div>
            <label className="text-[11px] text-muted-foreground">Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSelectedProjectId("");
              }}
              className="w-full mt-0.5 h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {selectedClient && selectedClient.projects.length > 0 && (
            <div>
              <label className="text-[11px] text-muted-foreground">
                Project (optional)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full mt-0.5 h-8 rounded-md border bg-background px-2 text-xs"
              >
                <option value="">None</option>
                {selectedClient.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            disabled={!selectedClientId || starting}
            onClick={startTimer}
          >
            <Play className="h-3 w-3 mr-1" />
            {starting ? "Starting..." : "Start Timer"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
