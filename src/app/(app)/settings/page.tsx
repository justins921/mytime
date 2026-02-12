"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Save, RefreshCw, MessageSquare, Mail, Trash2, ExternalLink, Palmtree, CalendarClock, Plus, CreditCard, Lock, ChevronDown, BookOpen, Plug } from "lucide-react";

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
  sat: "Saturday",
  sun: "Sunday",
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
  const [clickupApiToken, setClickupApiToken] = useState("");
  const [clickupWorkspaceMap, setClickupWorkspaceMap] = useState<Record<string, string>>({});
  const [clickupWorkspaces, setClickupWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [clickupLoading, setClickupLoading] = useState(false);
  const [clickupTestError, setClickupTestError] = useState("");
  const [allClients, setAllClients] = useState<{ id: string; name: string }[]>([]);
  const [slackWorkspaces, setSlackWorkspaces] = useState<
    { id: string; teamId: string; teamName: string; clientId: string | null; client: { id: string; name: string; color: string } | null }[]
  >([]);
  const [slackMessage, setSlackMessage] = useState("");
  const [gmailAccounts, setGmailAccounts] = useState<
    { id: string; email: string; clientId: string | null; client: { id: string; name: string; color: string } | null }[]
  >([]);
  const [gmailMessage, setGmailMessage] = useState("");
  const [timeOffs, setTimeOffs] = useState<
    { id: string; startDate: string; endDate: string; title: string; type: string; notes: string }[]
  >([]);
  const [newTimeOff, setNewTimeOff] = useState({ startDate: "", endDate: "", title: "", type: "Vacation", notes: "" });
  const [calendarFeeds, setCalendarFeeds] = useState<
    { id: string; name: string; url: string; color: string; enabled: boolean; lastSync: string | null; lastSyncError: string }[]
  >([]);
  const [newFeed, setNewFeed] = useState({ name: "", url: "", color: "#8b5cf6" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState("free");
  const [role, setRole] = useState("user");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const canUseIntegrations = plan === "pro" || plan === "business" || role === "admin";
  const isAdmin = role === "admin";

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
        setClickupApiToken(data.clickupApiToken || "");
        setClickupWorkspaceMap(JSON.parse(data.clickupWorkspaceMapJson || "{}"));
      });
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setAllClients(Array.isArray(data) ? data : []));
    fetch("/api/slack/workspaces")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSlackWorkspaces(data); });
    fetch("/api/gmail/accounts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setGmailAccounts(data); });
    fetch("/api/timeoff")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTimeOffs(data); });
    fetch("/api/calendar-feeds")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCalendarFeeds(data); });
    // Fetch plan from session
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(() => {
        // Plan comes from user record; fetch via a lightweight endpoint
        fetch("/api/settings")
          .then((r) => r.json())
          .then(() => {}); // plan is loaded separately below
      })
      .catch(() => {});
    fetch("/api/stripe/plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) setPlan(data.plan);
        if (data.role) setRole(data.role);
        if (data.email) setUserEmail(data.email);
        if (data.name) setUserName(data.name);
      })
      .catch(() => {});
    // Handle OAuth redirect params
    const params = new URLSearchParams(window.location.search);
    const slackConnected = params.get("slack_connected");
    const slackError = params.get("slack_error");
    const gmailConnected = params.get("gmail_connected");
    const gmailError = params.get("gmail_error");
    if (slackConnected) {
      setSlackMessage(`Connected to ${slackConnected}!`);
      window.history.replaceState({}, "", "/settings");
    } else if (slackError) {
      setSlackMessage(`Slack error: ${slackError}`);
      window.history.replaceState({}, "", "/settings");
    }
    if (gmailConnected) {
      setGmailMessage(`Connected ${gmailConnected}!`);
      window.history.replaceState({}, "", "/settings");
    } else if (gmailError) {
      setGmailMessage(`Gmail error: ${gmailError}`);
      window.history.replaceState({}, "", "/settings");
    }
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
        clickupApiToken,
        clickupWorkspaceMapJson: JSON.stringify(clickupWorkspaceMap),
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

      {/* Account */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Signed in as</span>
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
          {userName && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{userName}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan & Billing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Plan & Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm">Current plan:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
              {plan}
            </span>
          </div>
          {plan === "free" && (
            <div className="p-4 rounded-lg border bg-blue-50/50 space-y-3">
              <p className="text-sm font-medium">Upgrade to unlock integrations, unlimited clients, and more</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
                <Switch
                  checked={billingCycle === "annual"}
                  onCheckedChange={(v) => setBillingCycle(v ? "annual" : "monthly")}
                />
                <span className={`text-xs font-medium ${billingCycle === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
                  Annual
                </span>
                {billingCycle === "annual" && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Save ~17%</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={billingLoading}
                  onClick={async () => {
                    setBillingLoading(true);
                    const res = await fetch("/api/stripe/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ plan: "pro", billing: billingCycle }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    setBillingLoading(false);
                  }}
                >
                  Upgrade to Pro — {billingCycle === "annual" ? "$190/yr" : "$19/mo"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={billingLoading}
                  onClick={async () => {
                    setBillingLoading(true);
                    const res = await fetch("/api/stripe/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ plan: "business", billing: billingCycle }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    setBillingLoading(false);
                  }}
                >
                  Business — {billingCycle === "annual" ? "$390/yr" : "$39/mo"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">All plans include a 14-day free trial. Cancel anytime.</p>
            </div>
          )}
          {plan !== "free" && (
            <Button
              variant="outline"
              size="sm"
              disabled={billingLoading}
              onClick={async () => {
                setBillingLoading(true);
                const res = await fetch("/api/stripe/portal", { method: "POST" });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                setBillingLoading(false);
              }}
            >
              Manage Billing
            </Button>
          )}
        </CardContent>
      </Card>

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
            {isAdmin && (
              <div className="space-y-1">
                <Label className="text-xs">UC30 Weekly Hours Allocation</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={uc30WeeklyHours}
                  onChange={(e) => setUc30WeeklyHours(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
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

      {/* Time Off */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Palmtree className="h-4 w-4" />
            Time Off
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[10px] text-muted-foreground">
            Schedule vacations, sick days, holidays, or other unavailable times. The schedule generator will skip these dates.
          </p>

          {/* Existing time-off entries */}
          {timeOffs.length > 0 && (
            <div className="space-y-2">
              {timeOffs.map((to) => (
                <div key={to.id} className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-medium w-32 truncate">{to.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {to.startDate === to.endDate ? to.startDate : `${to.startDate} to ${to.endDate}`}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{to.type}</span>
                  {to.notes && <span className="text-xs text-muted-foreground truncate max-w-32">{to.notes}</span>}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive ml-auto"
                    onClick={async () => {
                      await fetch("/api/timeoff", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: to.id }),
                      });
                      setTimeOffs((prev) => prev.filter((t) => t.id !== to.id));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new time-off */}
          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={newTimeOff.title}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, title: e.target.value })}
                placeholder="e.g. Spring Break"
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={newTimeOff.startDate}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={newTimeOff.endDate}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={newTimeOff.type}
                onValueChange={(v) => setNewTimeOff({ ...newTimeOff, type: v })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="SickDay">Sick Day</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!newTimeOff.title || !newTimeOff.startDate || !newTimeOff.endDate}
              onClick={async () => {
                const res = await fetch("/api/timeoff", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newTimeOff),
                });
                const created = await res.json();
                if (created.id) {
                  setTimeOffs((prev) => [...prev, created].sort((a, b) => a.startDate.localeCompare(b.startDate)));
                  setNewTimeOff({ startDate: "", endDate: "", title: "", type: "Vacation", notes: "" });
                }
              }}
            >
              Add Time Off
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Feeds (ICS/Apple Calendar) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Calendar Feeds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">
              Add ICS calendar feed URLs to import events from Apple Calendar, Google Calendar, Outlook, or any calendar app.
              Events will appear on your schedule and block those time slots during generation.
            </p>
            <p className="text-[10px] text-muted-foreground">
              <strong>Apple Calendar:</strong> Open Calendar.app &rarr; right-click a calendar &rarr; &ldquo;Share Calendar&rdquo; &rarr; copy the webcal:// URL.
            </p>
          </div>

          {calendarFeeds.length > 0 && (
            <div className="space-y-2">
              {calendarFeeds.map((feed) => (
                <div key={feed.id} className="flex items-center gap-2 flex-wrap text-sm">
                  <input
                    type="color"
                    value={feed.color}
                    onChange={async (e) => {
                      const color = e.target.value;
                      await fetch(`/api/calendar-feeds/${feed.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ color }),
                      });
                      setCalendarFeeds((prev) => prev.map((f) => f.id === feed.id ? { ...f, color } : f));
                    }}
                    className="w-6 h-6 rounded border-0 cursor-pointer"
                  />
                  <Switch
                    checked={feed.enabled}
                    onCheckedChange={async (v) => {
                      await fetch(`/api/calendar-feeds/${feed.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: v }),
                      });
                      setCalendarFeeds((prev) => prev.map((f) => f.id === feed.id ? { ...f, enabled: v } : f));
                    }}
                  />
                  <span className="font-medium truncate max-w-40">{feed.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-48 font-mono">{feed.url}</span>
                  {feed.lastSync && (
                    <span className="text-[10px] text-muted-foreground">
                      Synced {new Date(feed.lastSync).toLocaleDateString()}
                    </span>
                  )}
                  {feed.lastSyncError && (
                    <span className="text-[10px] text-red-500 truncate max-w-32">{feed.lastSyncError}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive ml-auto"
                    onClick={async () => {
                      await fetch(`/api/calendar-feeds/${feed.id}`, { method: "DELETE" });
                      setCalendarFeeds((prev) => prev.filter((f) => f.id !== feed.id));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={newFeed.name}
                onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                placeholder="e.g. Work Calendar"
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ICS Feed URL</Label>
              <Input
                value={newFeed.url}
                onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                placeholder="webcal://... or https://..."
                className="w-64 font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={newFeed.color}
                onChange={(e) => setNewFeed({ ...newFeed, color: e.target.value })}
                className="w-10 h-9 rounded border cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!newFeed.name || !newFeed.url}
              onClick={async () => {
                // Normalize webcal:// to https://
                const url = newFeed.url.replace(/^webcal:\/\//, "https://");
                const res = await fetch("/api/calendar-feeds", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...newFeed, url }),
                });
                const created = await res.json();
                if (created.id) {
                  setCalendarFeeds((prev) => [...prev, created]);
                  setNewFeed({ name: "", url: "", color: "#8b5cf6" });
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Feed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations header with plan gate */}
      <div className="flex items-center gap-2 pt-4">
        <Plug className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Integrations</h2>
        {!canUseIntegrations && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            <Lock className="h-3 w-3" />
            Pro plan required
          </span>
        )}
      </div>

      {!canUseIntegrations && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Integrations require a Pro or Business plan</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Connect Slack, Gmail, Notion, ClickUp, and Calendar feeds to manage all your communication in one place.
              Upgrade to Pro to unlock all integrations.
            </p>
            <Button
              size="sm"
              onClick={async () => {
                setBillingLoading(true);
                const res = await fetch("/api/stripe/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ plan: "pro", billing: "monthly" }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                setBillingLoading(false);
              }}
              disabled={billingLoading}
            >
              Upgrade to Pro — $19/mo
            </Button>
          </CardContent>
        </Card>
      )}

      {canUseIntegrations && (
        <>
      {/* ClickUp integration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ClickUp Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="text-xs mb-3">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium flex items-center gap-1">
              <ChevronDown className="h-3 w-3" />
              How to connect ClickUp (step by step)
            </summary>
            <ol className="mt-2 ml-4 space-y-1 list-decimal text-muted-foreground">
              <li>Go to ClickUp &rarr; click your avatar (bottom-left) &rarr; <strong>Settings</strong></li>
              <li>Click <strong>Apps</strong> in the left sidebar</li>
              <li>Under &quot;API Token&quot;, click <strong>Generate</strong> (or copy your existing token)</li>
              <li>Paste the token below and click <strong>Test</strong></li>
              <li>Once connected, map each ClickUp workspace to a MyTime client</li>
              <li>Tasks from mapped workspaces will appear in the <strong>Triage</strong> tab</li>
            </ol>
          </details>

          <div className="space-y-1">
            <Label className="text-xs">Personal API Token</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={clickupApiToken}
                onChange={(e) => setClickupApiToken(e.target.value)}
                placeholder="pk_..."
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!clickupApiToken || clickupLoading}
                onClick={async () => {
                  setClickupLoading(true);
                  setClickupTestError("");
                  try {
                    // Save the token to the database first so the API can use it
                    await fetch("/api/settings", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ clickupApiToken }),
                    });
                    const res = await fetch("/api/clickup?action=workspaces");
                    const data = await res.json();
                    if (Array.isArray(data)) {
                      setClickupWorkspaces(data.map((t: { id: string | number; name: string }) => ({ id: String(t.id), name: t.name })));
                      setClickupTestError("");
                    } else {
                      setClickupTestError(data.error || "Invalid response from ClickUp. Check your token.");
                    }
                  } catch {
                    setClickupTestError("Failed to connect to ClickUp. Check your token and try again.");
                  }
                  setClickupLoading(false);
                }}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${clickupLoading ? "animate-spin" : ""}`} />
                Test
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Find this in ClickUp &rarr; Settings &rarr; Apps.
            </p>
            {clickupTestError && (
              <p className="text-xs text-red-600">{clickupTestError}</p>
            )}
          </div>

          {clickupWorkspaces.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Workspace → Client Mapping</Label>
              <p className="text-[10px] text-muted-foreground">
                Map each ClickUp workspace to a MyTime client so triage tasks auto-select the right client.
              </p>
              {clickupWorkspaces.map((ws) => (
                <div key={ws.id} className="flex items-center gap-2">
                  <span className="text-sm w-36 truncate">{ws.name}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Select
                    value={clickupWorkspaceMap[ws.id] || ""}
                    onValueChange={(v) =>
                      setClickupWorkspaceMap({ ...clickupWorkspaceMap, [ws.id]: v })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {allClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Slack integration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Slack Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {slackMessage && (
            <p className={`text-xs ${slackMessage.includes("error") ? "text-red-600" : "text-green-600"}`}>
              {slackMessage}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground">
            Connect your Slack workspaces and map them to clients. Messages will be filtered based on your current schedule.
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium flex items-center gap-1">
              <ChevronDown className="h-3 w-3" />
              How to connect Slack (step by step)
            </summary>
            <ol className="mt-2 ml-4 space-y-1 list-decimal text-muted-foreground">
              <li>Click <strong>&quot;Connect Slack Workspace&quot;</strong> below</li>
              <li>You&apos;ll be redirected to Slack&apos;s authorization page</li>
              <li>Select the workspace you want to connect</li>
              <li>Click <strong>&quot;Allow&quot;</strong> to grant MyTime access</li>
              <li>You&apos;ll be redirected back here — your workspace will appear below</li>
              <li>Map each workspace to a client using the dropdown</li>
            </ol>
          </details>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = "/api/slack/oauth"; }}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Connect Slack Workspace
          </Button>

          {slackWorkspaces.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs">Connected Workspaces</Label>
              {slackWorkspaces.map((ws) => (
                <div key={ws.id} className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium w-36 truncate">{ws.teamName}</span>
                  <span className="text-xs text-muted-foreground">&rarr;</span>
                  <Select
                    value={ws.clientId || "none"}
                    onValueChange={async (v) => {
                      const clientId = v === "none" ? null : v;
                      const res = await fetch("/api/slack/workspaces", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: ws.id, clientId }),
                      });
                      const updated = await res.json();
                      setSlackWorkspaces((prev) =>
                        prev.map((w) => (w.id === ws.id ? { ...w, clientId: updated.clientId, client: updated.client } : w))
                      );
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {allClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      await fetch("/api/slack/workspaces", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: ws.id }),
                      });
                      setSlackWorkspaces((prev) => prev.filter((w) => w.id !== ws.id));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gmail integration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Gmail Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gmailMessage && (
            <p className={`text-xs ${gmailMessage.includes("error") ? "text-red-600" : "text-green-600"}`}>
              {gmailMessage}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground">
            Connect your Gmail accounts and map them to clients. Emails will be available in your unified inbox and kanban board.
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium flex items-center gap-1">
              <ChevronDown className="h-3 w-3" />
              How to connect Gmail (step by step)
            </summary>
            <ol className="mt-2 ml-4 space-y-1 list-decimal text-muted-foreground">
              <li>Click <strong>&quot;Connect Gmail Account&quot;</strong> below</li>
              <li>You&apos;ll be redirected to Google&apos;s sign-in page</li>
              <li>Choose the Gmail account you want to connect</li>
              <li>Review the permissions and click <strong>&quot;Allow&quot;</strong></li>
              <li>You&apos;ll be redirected back here — your account will appear below</li>
              <li>Map each account to a client using the dropdown</li>
              <li>Emails from this account will now appear in the <strong>Email</strong> tab</li>
            </ol>
          </details>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = "/api/gmail/oauth"; }}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Connect Gmail Account
          </Button>

          {gmailAccounts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs">Connected Accounts</Label>
              {gmailAccounts.map((acct) => (
                <div key={acct.id} className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium w-48 truncate">{acct.email}</span>
                  <span className="text-xs text-muted-foreground">&rarr;</span>
                  <Select
                    value={acct.clientId || "none"}
                    onValueChange={async (v) => {
                      const clientId = v === "none" ? null : v;
                      const res = await fetch("/api/gmail/accounts", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: acct.id, clientId }),
                      });
                      const updated = await res.json();
                      setGmailAccounts((prev) =>
                        prev.map((a) => (a.id === acct.id ? { ...a, clientId: updated.clientId, client: updated.client } : a))
                      );
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {allClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      await fetch("/api/gmail/accounts", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: acct.id }),
                      });
                      setGmailAccounts((prev) => prev.filter((a) => a.id !== acct.id));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
