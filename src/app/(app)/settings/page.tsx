"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save } from "lucide-react";

interface AvailabilityWindow {
  start: string;
  end: string;
  enabled: boolean;
}

interface NightWork {
  enabled: boolean;
  start: string;
  end: string;
}

interface BreakConfig {
  start: string;
  end: string;
  title: string;
  locked: boolean;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [availability, setAvailability] = useState<Record<string, AvailabilityWindow>>({});
  const [nightWork, setNightWork] = useState<Record<string, NightWork>>({});
  const [fixedBreaks, setFixedBreaks] = useState<BreakConfig[]>([]);
  const [lunchReserve, setLunchReserve] = useState<BreakConfig>({ start: "12:45", end: "13:15", title: "Lunch", locked: false });
  const [timezone, setTimezone] = useState("America/Chicago");
  const [supportSweepMinutes, setSupportSweepMinutes] = useState(30);
  const [generateFromNow, setGenerateFromNow] = useState(false);
  const [uc30WeeklyHours, setUc30WeeklyHours] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setAvailability(JSON.parse(data.availabilityJson));
        setNightWork(JSON.parse(data.nightWorkJson));
        setFixedBreaks(JSON.parse(data.fixedBreaksJson));
        setLunchReserve(JSON.parse(data.lunchReserveJson));
        setTimezone(data.timezone);
        setSupportSweepMinutes(data.supportSweepMinutes);
        setGenerateFromNow(data.generateFromNow);
        setUc30WeeklyHours(data.uc30WeeklyHours);
      });
  }, []);

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        availabilityJson: JSON.stringify(availability),
        nightWorkJson: JSON.stringify(nightWork),
        fixedBreaksJson: JSON.stringify(fixedBreaks),
        lunchReserveJson: JSON.stringify(lunchReserve),
        supportSweepMinutes,
        generateFromNow,
        uc30WeeklyHours,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Settings</h2>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      {/* General */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Timezone</Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Support Sweep Duration (min)</Label>
              <Input
                type="number"
                value={supportSweepMinutes}
                onChange={(e) => setSupportSweepMinutes(parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UC30 Weekly Hours Allocation</Label>
              <Input
                type="number"
                step="0.5"
                value={uc30WeeklyHours}
                onChange={(e) => setUc30WeeklyHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={generateFromNow} onCheckedChange={setGenerateFromNow} />
              <Label className="text-xs">Default: Generate from now</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability per day */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(DAY_LABELS).map(([key, label]) => {
              const day = availability[key] || { start: "09:00", end: "15:30", enabled: true };
              return (
                <div key={key} className="flex items-center gap-3 flex-wrap">
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={(v) =>
                      setAvailability({ ...availability, [key]: { ...day, enabled: v } })
                    }
                  />
                  <span className="w-20 text-sm font-medium">{label}</span>
                  <Input
                    type="time"
                    value={day.start}
                    onChange={(e) =>
                      setAvailability({ ...availability, [key]: { ...day, start: e.target.value } })
                    }
                    className="w-28"
                    disabled={!day.enabled}
                  />
                  <span className="text-sm">to</span>
                  <Input
                    type="time"
                    value={day.end}
                    onChange={(e) =>
                      setAvailability({ ...availability, [key]: { ...day, end: e.target.value } })
                    }
                    className="w-28"
                    disabled={!day.enabled}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fixed breaks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fixed Breaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fixedBreaks.map((brk, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <Input
                  value={brk.title}
                  onChange={(e) => {
                    const updated = [...fixedBreaks];
                    updated[i] = { ...updated[i], title: e.target.value };
                    setFixedBreaks(updated);
                  }}
                  className="w-40"
                />
                <Input
                  type="time"
                  value={brk.start}
                  onChange={(e) => {
                    const updated = [...fixedBreaks];
                    updated[i] = { ...updated[i], start: e.target.value };
                    setFixedBreaks(updated);
                  }}
                  className="w-28"
                />
                <span className="text-sm">to</span>
                <Input
                  type="time"
                  value={brk.end}
                  onChange={(e) => {
                    const updated = [...fixedBreaks];
                    updated[i] = { ...updated[i], end: e.target.value };
                    setFixedBreaks(updated);
                  }}
                  className="w-28"
                />
                <div className="flex items-center gap-1">
                  <Switch
                    checked={brk.locked}
                    onCheckedChange={(v) => {
                      const updated = [...fixedBreaks];
                      updated[i] = { ...updated[i], locked: v };
                      setFixedBreaks(updated);
                    }}
                  />
                  <Label className="text-xs">Locked</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFixedBreaks(fixedBreaks.filter((_, j) => j !== i))}
                  className="text-xs text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFixedBreaks([...fixedBreaks, { start: "10:00", end: "10:30", title: "Break", locked: false }])
              }
            >
              Add Break
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lunch reserve */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lunch Reserve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={lunchReserve.title}
              onChange={(e) => setLunchReserve({ ...lunchReserve, title: e.target.value })}
              className="w-40"
            />
            <Input
              type="time"
              value={lunchReserve.start}
              onChange={(e) => setLunchReserve({ ...lunchReserve, start: e.target.value })}
              className="w-28"
            />
            <span className="text-sm">to</span>
            <Input
              type="time"
              value={lunchReserve.end}
              onChange={(e) => setLunchReserve({ ...lunchReserve, end: e.target.value })}
              className="w-28"
            />
          </div>
        </CardContent>
      </Card>

      {/* Night work per day */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Night Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(DAY_LABELS).map(([key, label]) => {
              const nw = nightWork[key] || { enabled: false, start: "20:00", end: "22:00" };
              return (
                <div key={key} className="flex items-center gap-3 flex-wrap">
                  <Switch
                    checked={nw.enabled}
                    onCheckedChange={(v) =>
                      setNightWork({ ...nightWork, [key]: { ...nw, enabled: v } })
                    }
                  />
                  <span className="w-20 text-sm font-medium">{label}</span>
                  <Input
                    type="time"
                    value={nw.start}
                    onChange={(e) =>
                      setNightWork({ ...nightWork, [key]: { ...nw, start: e.target.value } })
                    }
                    className="w-28"
                    disabled={!nw.enabled}
                  />
                  <span className="text-sm">to</span>
                  <Input
                    type="time"
                    value={nw.end}
                    onChange={(e) =>
                      setNightWork({ ...nightWork, [key]: { ...nw, end: e.target.value } })
                    }
                    className="w-28"
                    disabled={!nw.enabled}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
