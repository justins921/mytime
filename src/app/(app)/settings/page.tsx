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
import { Settings as SettingsIcon, Save, RefreshCw, MessageSquare, Mail, Trash2, ExternalLink, Palmtree, CalendarClock, Plus, CreditCard, Lock, ChevronDown, BookOpen, Plug, KeyRound, CheckCircle2, Inbox, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [weekStartDay, setWeekStartDay] = useState<"monday" | "sunday">("monday");
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
  const [notionWorkspaces, setNotionWorkspaces] = useState<
    { id: string; workspaceId: string; workspaceName: string; botId: string }[]
  >([]);
  const [notionToken, setNotionToken] = useState("");
  const [notionName, setNotionName] = useState("");
  const [notionLoading, setNotionLoading] = useState(false);
  const [notionMessage, setNotionMessage] = useState("");
  const [outlookAccounts, setOutlookAccounts] = useState<
    { id: string; email: string; clientId: string | null; client: { id: string; name: string; color: string } | null }[]
  >([]);
  const [outlookMessage, setOutlookMessage] = useState("");
  const [trelloApiToken, setTrelloApiToken] = useState("");
  const [asanaApiToken, setAsanaApiToken] = useState("");
  const [mondayApiToken, setMondayApiToken] = useState("");
  const [timeOffs, setTimeOffs] = useState<
    { id: string; startDate: string; endDate: string; title: string; type: string; notes: string }[]
  >([]);
  const [newTimeOff, setNewTimeOff] = useState({ startDate: "", endDate: "", title: "", type: "Vacation", notes: "" });
  const [calendarFeeds, setCalendarFeeds] = useState<
    { id: string; name: string; url: string; color: string; enabled: boolean; lastSync: string | null; lastSyncError: string }[]
  >([]);
  const [newFeed, setNewFeed] = useState({ name: "", url: "", color: "#8b5cf6" });
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [addIntegrationStep, setAddIntegrationStep] = useState<"pick" | "clickup" | "notion" | "trello" | "asana" | "monday">("pick");
  const [managingIntegration, setManagingIntegration] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState("free");
  const [role, setRole] = useState("user");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const canUseIntegrations = plan === "pro" || plan === "business" || role === "admin";
  const isAdmin = role === "admin";

  useEffect(() => {
    const safeParse = (json: string, fallback: unknown) => {
      try { return JSON.parse(json); } catch { return fallback; }
    };

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setAvailability(safeParse(data.availabilityJson, {}));
        setNightWork(safeParse(data.nightWorkJson, {}));
        setFixedBreaks(safeParse(data.fixedBreaksJson, []));
        setLunchReserve(safeParse(data.lunchReserveJson, { start: "12:45", end: "13:15", title: "Lunch", locked: false }));
        setTimezone(data.timezone);
        if (data.weekStartDay === "sunday" || data.weekStartDay === "monday") {
          setWeekStartDay(data.weekStartDay);
        }
        setSupportSweepMinutes(data.supportSweepMinutes);
        setGenerateFromNow(data.generateFromNow);
        setUc30WeeklyHours(data.uc30WeeklyHours);
        setClickupApiToken(data.clickupApiToken || "");
        setClickupWorkspaceMap(safeParse(data.clickupWorkspaceMapJson || "{}", {}));
        setTrelloApiToken(data.trelloApiToken || "");
        setAsanaApiToken(data.asanaApiToken || "");
        setMondayApiToken(data.mondayApiToken || "");
      })
      .catch(() => setSettings({}));
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setAllClients(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/slack/workspaces")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSlackWorkspaces(data); })
      .catch(() => {});
    fetch("/api/gmail/accounts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setGmailAccounts(data); })
      .catch(() => {});
    fetch("/api/notion/workspaces")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotionWorkspaces(data); })
      .catch(() => {});
    fetch("/api/outlook/accounts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setOutlookAccounts(data); })
      .catch(() => {});
    fetch("/api/timeoff")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTimeOffs(data); })
      .catch(() => {});
    fetch("/api/calendar-feeds")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCalendarFeeds(data); })
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
    const outlookConnected = params.get("outlook_connected");
    const outlookError = params.get("outlook_error");
    if (outlookConnected) {
      setOutlookMessage(`Connected ${outlookConnected}!`);
      window.history.replaceState({}, "", "/settings");
    } else if (outlookError) {
      setOutlookMessage(`Outlook error: ${outlookError}`);
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
        weekStartDay,
        availabilityJson: JSON.stringify(availability),
        nightWorkJson: JSON.stringify(nightWork),
        fixedBreaksJson: JSON.stringify(fixedBreaks),
        lunchReserveJson: JSON.stringify(lunchReserve),
        supportSweepMinutes,
        generateFromNow,
        uc30WeeklyHours,
        clickupApiToken,
        clickupWorkspaceMapJson: JSON.stringify(clickupWorkspaceMap),
        trelloApiToken,
        asanaApiToken,
        mondayApiToken,
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

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3 max-w-xl">
            <div className="space-y-1">
              <Label className="text-xs">Current password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">New password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirm new password</Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-xs text-red-500">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-xs text-green-600">{passwordMessage}</p>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
            onClick={async () => {
              setPasswordError("");
              setPasswordMessage("");
              if (newPassword.length < 8) {
                setPasswordError("New password must be at least 8 characters");
                return;
              }
              if (newPassword !== confirmNewPassword) {
                setPasswordError("Passwords don't match");
                return;
              }
              setPasswordLoading(true);
              try {
                const res = await fetch("/api/auth/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setPasswordError(data.error || "Something went wrong");
                } else {
                  setPasswordMessage("Password updated successfully");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }
              } catch {
                setPasswordError("Something went wrong");
              }
              setPasswordLoading(false);
            }}
          >
            {passwordLoading ? "Updating..." : "Update password"}
          </Button>
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
                  Upgrade to Pro — {billingCycle === "annual" ? "$180/yr" : "$19/mo"}
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
                  Business — {billingCycle === "annual" ? "$348/yr" : "$39/mo"}
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
              <Label className="text-xs">Week Starts On</Label>
              <Select value={weekStartDay} onValueChange={(v) => setWeekStartDay(v as "monday" | "sunday")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday (Mon - Sun)</SelectItem>
                  <SelectItem value="sunday">Sunday (Sun - Sat)</SelectItem>
                </SelectContent>
              </Select>
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
                className="w-full sm:w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={newTimeOff.startDate}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                className="w-full sm:w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={newTimeOff.endDate}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                className="w-full sm:w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={newTimeOff.type}
                onValueChange={(v) => setNewTimeOff({ ...newTimeOff, type: v })}
              >
                <SelectTrigger className="w-full sm:w-32">
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
            <p className="text-[10px] text-muted-foreground">
              <strong>Google Calendar:</strong> Go to Settings &rarr; click your calendar &rarr; &ldquo;Integrate calendar&rdquo; &rarr; copy the &ldquo;Secret address in iCal format&rdquo; URL.
            </p>
            <p className="text-[10px] text-muted-foreground">
              <strong>Outlook:</strong> Go to Settings &rarr; Calendar &rarr; Shared calendars &rarr; &ldquo;Publish a calendar&rdquo; &rarr; copy the ICS link.
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
                className="w-full sm:w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ICS Feed URL</Label>
              <Input
                value={newFeed.url}
                onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                placeholder="webcal://... or https://..."
                className="w-full sm:w-64 font-mono text-xs"
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

      {/* Integrations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrations
            {!canUseIntegrations && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                <Lock className="h-3 w-3" />
                Pro plan required
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canUseIntegrations ? (
            <div className="text-center space-y-3 py-4">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Integrations require a Pro or Business plan</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Connect Slack, Gmail, Notion, ClickUp, and more to manage all your communication in one place.
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
            </div>
          ) : (
            <>
              {slackMessage && <p className={`text-xs ${slackMessage.includes("error") ? "text-red-600" : "text-green-600"}`}>{slackMessage}</p>}
              {gmailMessage && <p className={`text-xs ${gmailMessage.includes("error") ? "text-red-600" : "text-green-600"}`}>{gmailMessage}</p>}
              {outlookMessage && <p className={`text-xs ${outlookMessage.includes("error") ? "text-red-600" : "text-green-600"}`}>{outlookMessage}</p>}
              {notionMessage && <p className={`text-xs ${notionMessage.includes("error") || notionMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>{notionMessage}</p>}
              {clickupTestError && <p className="text-xs text-red-600">{clickupTestError}</p>}

              {/* Connected integrations list */}
              {(() => {
                const connected: { key: string; icon: React.ReactNode; label: string; detail: string }[] = [];
                if (slackWorkspaces.length > 0) connected.push({ key: "slack", icon: <MessageSquare className="h-4 w-4" />, label: "Slack", detail: `${slackWorkspaces.length} workspace${slackWorkspaces.length > 1 ? "s" : ""}` });
                if (gmailAccounts.length > 0) connected.push({ key: "gmail", icon: <Mail className="h-4 w-4" />, label: "Gmail", detail: `${gmailAccounts.length} account${gmailAccounts.length > 1 ? "s" : ""}` });
                if (outlookAccounts.length > 0) connected.push({ key: "outlook", icon: <Mail className="h-4 w-4" />, label: "Outlook", detail: `${outlookAccounts.length} account${outlookAccounts.length > 1 ? "s" : ""}` });
                if (notionWorkspaces.length > 0) connected.push({ key: "notion", icon: <BookOpen className="h-4 w-4" />, label: "Notion", detail: `${notionWorkspaces.length} workspace${notionWorkspaces.length > 1 ? "s" : ""}` });
                if (clickupApiToken) connected.push({ key: "clickup", icon: <Inbox className="h-4 w-4" />, label: "ClickUp", detail: clickupWorkspaces.length > 0 ? `${clickupWorkspaces.length} workspace${clickupWorkspaces.length > 1 ? "s" : ""}` : "Connected" });
                if (trelloApiToken) connected.push({ key: "trello", icon: <Plug className="h-4 w-4" />, label: "Trello", detail: "Connected" });
                if (asanaApiToken) connected.push({ key: "asana", icon: <Plug className="h-4 w-4" />, label: "Asana", detail: "Connected" });
                if (mondayApiToken) connected.push({ key: "monday", icon: <Plug className="h-4 w-4" />, label: "Monday.com", detail: "Connected" });

                if (connected.length === 0) {
                  return (
                    <div className="text-center py-6 space-y-3">
                      <Plug className="h-8 w-8 mx-auto text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No integrations connected yet</p>
                      <Button size="sm" onClick={() => { setAddIntegrationStep("pick"); setShowAddIntegration(true); }}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Integration
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {connected.map((item) => (
                      <div key={item.key}>
                        <div
                          className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => setManagingIntegration(managingIntegration === item.key ? null : item.key)}
                        >
                          <div className="text-muted-foreground">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{item.detail}</span>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${managingIntegration === item.key ? "rotate-180" : ""}`} />
                        </div>

                        {/* Expanded management panel */}
                        {managingIntegration === "slack" && item.key === "slack" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-3">
                            {slackWorkspaces.map((ws) => (
                              <div key={ws.id} className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium w-36 truncate">{ws.teamName}</span>
                                <span className="text-xs text-muted-foreground">&rarr;</span>
                                <Select value={ws.clientId || "none"} onValueChange={async (v) => {
                                  const clientId = v === "none" ? null : v;
                                  const res = await fetch("/api/slack/workspaces", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ws.id, clientId }) });
                                  const updated = await res.json();
                                  setSlackWorkspaces((prev) => prev.map((w) => (w.id === ws.id ? { ...w, clientId: updated.clientId, client: updated.client } : w)));
                                }}>
                                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs">No client</SelectItem>
                                    {allClients.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={async () => {
                                  await fetch("/api/slack/workspaces", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ws.id }) });
                                  setSlackWorkspaces((prev) => prev.filter((w) => w.id !== ws.id));
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { window.location.href = "/api/slack/oauth"; }}>
                              <Plus className="h-3 w-3 mr-1" />Add Another Workspace
                            </Button>
                          </div>
                        )}

                        {managingIntegration === "gmail" && item.key === "gmail" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-3">
                            {gmailAccounts.map((acct) => (
                              <div key={acct.id} className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium w-44 truncate">{acct.email}</span>
                                <span className="text-xs text-muted-foreground">&rarr;</span>
                                <Select value={acct.clientId || "none"} onValueChange={async (v) => {
                                  const clientId = v === "none" ? null : v;
                                  const res = await fetch("/api/gmail/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: acct.id, clientId }) });
                                  const updated = await res.json();
                                  setGmailAccounts((prev) => prev.map((a) => (a.id === acct.id ? { ...a, clientId: updated.clientId, client: updated.client } : a)));
                                }}>
                                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs">No client</SelectItem>
                                    {allClients.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={async () => {
                                  await fetch("/api/gmail/accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: acct.id }) });
                                  setGmailAccounts((prev) => prev.filter((a) => a.id !== acct.id));
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { window.location.href = "/api/gmail/oauth"; }}>
                              <Plus className="h-3 w-3 mr-1" />Add Another Account
                            </Button>
                          </div>
                        )}

                        {managingIntegration === "outlook" && item.key === "outlook" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-3">
                            {outlookAccounts.map((acct) => (
                              <div key={acct.id} className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium w-44 truncate">{acct.email}</span>
                                <span className="text-xs text-muted-foreground">&rarr;</span>
                                <Select value={acct.clientId || "none"} onValueChange={async (v) => {
                                  const clientId = v === "none" ? null : v;
                                  const res = await fetch("/api/outlook/accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: acct.id, clientId }) });
                                  const updated = await res.json();
                                  setOutlookAccounts((prev) => prev.map((a) => (a.id === acct.id ? { ...a, clientId: updated.clientId, client: updated.client } : a)));
                                }}>
                                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs">No client</SelectItem>
                                    {allClients.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={async () => {
                                  await fetch("/api/outlook/accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: acct.id }) });
                                  setOutlookAccounts((prev) => prev.filter((a) => a.id !== acct.id));
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { window.location.href = "/api/outlook/oauth"; }}>
                              <Plus className="h-3 w-3 mr-1" />Add Another Account
                            </Button>
                          </div>
                        )}

                        {managingIntegration === "notion" && item.key === "notion" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-3">
                            {notionWorkspaces.map((ws) => (
                              <div key={ws.id} className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate flex-1">{ws.workspaceName}</span>
                                <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={async () => {
                                  await fetch("/api/notion/workspaces", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ws.id }) });
                                  setNotionWorkspaces((prev) => prev.filter((w) => w.id !== ws.id));
                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder="ntn_..." className="font-mono h-8 text-xs flex-1" />
                              <Input value={notionName} onChange={(e) => setNotionName(e.target.value)} placeholder="Name (optional)" className="w-32 h-8 text-xs" />
                              <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!notionToken || notionLoading} onClick={async () => {
                                setNotionLoading(true); setNotionMessage("");
                                try {
                                  const res = await fetch("/api/notion/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: notionToken, name: notionName || undefined }) });
                                  const data = await res.json();
                                  if (!res.ok) { setNotionMessage(data.error || "Failed to connect"); }
                                  else { setNotionWorkspaces((prev) => { const exists = prev.find((w) => w.id === data.id); return exists ? prev.map((w) => (w.id === data.id ? data : w)) : [...prev, data]; }); setNotionToken(""); setNotionName(""); setNotionMessage(`Connected to ${data.workspaceName}!`); }
                                } catch { setNotionMessage("Error: failed to connect."); }
                                setNotionLoading(false);
                              }}>
                                <Plus className="h-3 w-3 mr-1" />{notionLoading ? "..." : "Add"}
                              </Button>
                            </div>
                          </div>
                        )}

                        {managingIntegration === "clickup" && item.key === "clickup" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-3">
                            <div className="flex gap-2">
                              <Input type="password" value={clickupApiToken} onChange={(e) => setClickupApiToken(e.target.value)} placeholder="pk_..." className="font-mono h-8 text-xs flex-1" />
                              <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!clickupApiToken || clickupLoading} onClick={async () => {
                                setClickupLoading(true); setClickupTestError("");
                                try {
                                  await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clickupApiToken }) });
                                  const res = await fetch("/api/clickup?action=workspaces"); const data = await res.json();
                                  if (Array.isArray(data)) { setClickupWorkspaces(data.map((t: { id: string | number; name: string }) => ({ id: String(t.id), name: t.name }))); }
                                  else { setClickupTestError(data.error || "Invalid response"); }
                                } catch { setClickupTestError("Failed to connect"); }
                                setClickupLoading(false);
                              }}>
                                <RefreshCw className={`h-3 w-3 mr-1 ${clickupLoading ? "animate-spin" : ""}`} />Test
                              </Button>
                            </div>
                            {clickupWorkspaces.length > 0 && clickupWorkspaces.map((ws) => (
                              <div key={ws.id} className="flex items-center gap-2">
                                <span className="text-sm w-36 truncate">{ws.name}</span>
                                <span className="text-xs text-muted-foreground">&rarr;</span>
                                <Select value={clickupWorkspaceMap[ws.id] || ""} onValueChange={(v) => setClickupWorkspaceMap({ ...clickupWorkspaceMap, [ws.id]: v })}>
                                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs">None</SelectItem>
                                    {allClients.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => { setClickupApiToken(""); setClickupWorkspaces([]); }}>
                              <Trash2 className="h-3 w-3 mr-1" />Disconnect ClickUp
                            </Button>
                          </div>
                        )}

                        {managingIntegration === "trello" && item.key === "trello" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-2">
                            <div className="flex gap-2">
                              <Input type="password" value={trelloApiToken} onChange={(e) => setTrelloApiToken(e.target.value)} placeholder="key:token" className="font-mono h-8 text-xs flex-1" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">API key and token separated by colon. Save settings to apply.</p>
                            <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => setTrelloApiToken("")}>
                              <Trash2 className="h-3 w-3 mr-1" />Disconnect Trello
                            </Button>
                          </div>
                        )}

                        {managingIntegration === "asana" && item.key === "asana" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-2">
                            <div className="flex gap-2">
                              <Input type="password" value={asanaApiToken} onChange={(e) => setAsanaApiToken(e.target.value)} placeholder="1/1234567890:abcdef..." className="font-mono h-8 text-xs flex-1" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Personal Access Token. Save settings to apply.</p>
                            <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => setAsanaApiToken("")}>
                              <Trash2 className="h-3 w-3 mr-1" />Disconnect Asana
                            </Button>
                          </div>
                        )}

                        {managingIntegration === "monday" && item.key === "monday" && (
                          <div className="mt-1 ml-9 p-3 rounded-md border bg-muted/30 space-y-2">
                            <div className="flex gap-2">
                              <Input type="password" value={mondayApiToken} onChange={(e) => setMondayApiToken(e.target.value)} placeholder="eyJhbGciOi..." className="font-mono h-8 text-xs flex-1" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">API token. Save settings to apply.</p>
                            <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => setMondayApiToken("")}>
                              <Trash2 className="h-3 w-3 mr-1" />Disconnect Monday.com
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setAddIntegrationStep("pick"); setShowAddIntegration(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Another Integration
                    </Button>
                  </div>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Integration Dialog */}
      <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {addIntegrationStep === "pick" ? "Add Integration" : (
                <button onClick={() => setAddIntegrationStep("pick")} className="flex items-center gap-2 hover:text-muted-foreground transition-colors">
                  <ChevronDown className="h-4 w-4 rotate-90" />
                  Back
                </button>
              )}
            </DialogTitle>
          </DialogHeader>

          {addIntegrationStep === "pick" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "slack" as const, icon: <MessageSquare className="h-5 w-5" />, label: "Slack", desc: "Messages & channels", action: "oauth" },
                { key: "gmail" as const, icon: <Mail className="h-5 w-5" />, label: "Gmail", desc: "Email inbox & kanban", action: "oauth" },
                { key: "outlook" as const, icon: <Mail className="h-5 w-5" />, label: "Outlook", desc: "Microsoft 365 email", action: "oauth" },
                { key: "notion" as const, icon: <BookOpen className="h-5 w-5" />, label: "Notion", desc: "Pages & docs", action: "token" },
                { key: "clickup" as const, icon: <Inbox className="h-5 w-5" />, label: "ClickUp", desc: "Task triage", action: "token" },
                { key: "trello" as const, icon: <Plug className="h-5 w-5" />, label: "Trello", desc: "Card triage", action: "token" },
                { key: "asana" as const, icon: <Plug className="h-5 w-5" />, label: "Asana", desc: "Task triage", action: "token" },
                { key: "monday" as const, icon: <Plug className="h-5 w-5" />, label: "Monday.com", desc: "Item triage", action: "token" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === "slack") { window.location.href = "/api/slack/oauth"; }
                    else if (item.key === "gmail") { window.location.href = "/api/gmail/oauth"; }
                    else if (item.key === "outlook") { window.location.href = "/api/outlook/oauth"; }
                    else { setAddIntegrationStep(item.key); }
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="text-muted-foreground">{item.icon}</div>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </div>
                  {item.action === "oauth" && <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />}
                </button>
              ))}
            </div>
          )}

          {addIntegrationStep === "clickup" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Find your API token in ClickUp &rarr; Settings &rarr; Apps.</p>
              <div className="flex gap-2">
                <Input type="password" value={clickupApiToken} onChange={(e) => setClickupApiToken(e.target.value)} placeholder="pk_..." className="font-mono" />
                <Button variant="outline" disabled={!clickupApiToken || clickupLoading} onClick={async () => {
                  setClickupLoading(true); setClickupTestError("");
                  try {
                    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clickupApiToken }) });
                    const res = await fetch("/api/clickup?action=workspaces"); const data = await res.json();
                    if (Array.isArray(data)) { setClickupWorkspaces(data.map((t: { id: string | number; name: string }) => ({ id: String(t.id), name: t.name }))); setShowAddIntegration(false); }
                    else { setClickupTestError(data.error || "Invalid response"); }
                  } catch { setClickupTestError("Failed to connect"); }
                  setClickupLoading(false);
                }}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${clickupLoading ? "animate-spin" : ""}`} />Connect
                </Button>
              </div>
              {clickupTestError && <p className="text-xs text-red-600">{clickupTestError}</p>}
            </div>
          )}

          {addIntegrationStep === "notion" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Create an integration in Notion &rarr; Settings &rarr; Connections &rarr; Develop or manage integrations, then paste the token.</p>
              <div className="flex gap-2">
                <Input type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} placeholder="ntn_..." className="font-mono flex-1" />
                <Input value={notionName} onChange={(e) => setNotionName(e.target.value)} placeholder="Name (optional)" className="w-40" />
                <Button variant="outline" disabled={!notionToken || notionLoading} onClick={async () => {
                  setNotionLoading(true); setNotionMessage("");
                  try {
                    const res = await fetch("/api/notion/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: notionToken, name: notionName || undefined }) });
                    const data = await res.json();
                    if (!res.ok) { setNotionMessage(data.error || "Failed to connect"); }
                    else { setNotionWorkspaces((prev) => { const exists = prev.find((w) => w.id === data.id); return exists ? prev.map((w) => (w.id === data.id ? data : w)) : [...prev, data]; }); setNotionToken(""); setNotionName(""); setShowAddIntegration(false); setNotionMessage(`Connected to ${data.workspaceName}!`); }
                  } catch { setNotionMessage("Error: failed to connect."); }
                  setNotionLoading(false);
                }}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${notionLoading ? "animate-spin" : ""}`} />Connect
                </Button>
              </div>
            </div>
          )}

          {addIntegrationStep === "trello" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Get your API key and token from trello.com/power-ups/admin. Paste them as <code className="bg-muted px-1 rounded">key:token</code>.</p>
              <div className="flex gap-2">
                <Input type="password" value={trelloApiToken} onChange={(e) => setTrelloApiToken(e.target.value)} placeholder="key:token" className="font-mono flex-1" />
                <Button onClick={() => { if (trelloApiToken) { saveSettings(); setShowAddIntegration(false); } }} disabled={!trelloApiToken}>Save & Connect</Button>
              </div>
            </div>
          )}

          {addIntegrationStep === "asana" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Get your Personal Access Token from app.asana.com/-/developer_console.</p>
              <div className="flex gap-2">
                <Input type="password" value={asanaApiToken} onChange={(e) => setAsanaApiToken(e.target.value)} placeholder="1/1234567890:abcdef..." className="font-mono flex-1" />
                <Button onClick={() => { if (asanaApiToken) { saveSettings(); setShowAddIntegration(false); } }} disabled={!asanaApiToken}>Save & Connect</Button>
              </div>
            </div>
          )}

          {addIntegrationStep === "monday" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Get your API token from Monday.com &rarr; avatar &rarr; Administration &rarr; API.</p>
              <div className="flex gap-2">
                <Input type="password" value={mondayApiToken} onChange={(e) => setMondayApiToken(e.target.value)} placeholder="eyJhbGciOi..." className="font-mono flex-1" />
                <Button onClick={() => { if (mondayApiToken) { saveSettings(); setShowAddIntegration(false); } }} disabled={!mondayApiToken}>Save & Connect</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
