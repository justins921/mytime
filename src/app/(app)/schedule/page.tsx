"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatTime, timeToMinutes, getWeekDates, formatDate } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

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

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function SchedulePage() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [keepLocked, setKeepLocked] = useState(true);
  const [keepManual, setKeepManual] = useState(true);
  const [generateFromNow, setGenerateFromNow] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [today, setToday] = useState("");

  const weekDates = getWeekDates(
    new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000)
  );
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[4]);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/schedule?weekStart=${weekStart}&weekEnd=${weekEnd}`);
    const data = await res.json();
    setBlocks(data);
    setLoading(false);
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

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
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/schedule/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekDates: weekDates.map(formatDate),
        keepLocked,
        keepManual,
        generateFromNow,
      }),
    });
    const data = await res.json();
    setBlocks(data.blocks);
    setWarnings(data.warnings || []);
    setGenerating(false);
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

  function blocksByDate(date: string) {
    return blocks.filter((b) => b.date === date);
  }

  function getBlockClass(type: string) {
    const map: Record<string, string> = {
      DeepWork: "block-deepwork",
      Support: "block-support",
      Break: "block-break",
      Admin: "block-admin",
      Lunch: "block-lunch",
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

      {/* Generate controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
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
        </CardContent>
      </Card>

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

      {/* Schedule grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading schedule...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {weekDates.map((date, i) => {
            const dateStr = formatDate(date);
            const dayBlocks = blocksByDate(dateStr);
            const isToday = dateStr === today;

            return (
              <Card key={dateStr} className={isToday ? "ring-2 ring-primary" : ""}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="hidden md:inline">{DAY_NAMES[i]}</span>
                    <span className="md:hidden">{DAY_NAMES_SHORT[i]}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5 relative">
                  {isToday && currentTime && (
                    <div className="text-xs text-red-500 font-mono mb-2 text-center">
                      Now: {formatTime(currentTime)}
                    </div>
                  )}
                  {dayBlocks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No blocks</p>
                  )}
                  {dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`p-2 rounded text-xs ${getBlockClass(block.type)} ${
                        isPast(block) ? "block-past" : ""
                      }`}
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-deepwork" /> Deep Work</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-support" /> Support</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-break" /> Break</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-admin" /> Admin</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded block-lunch" /> Lunch</div>
      </div>
    </div>
  );
}
