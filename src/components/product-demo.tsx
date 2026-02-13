"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Calendar,
  Zap,
  Play,
  RotateCcw,
  Timer,
  BarChart3,
  MessageSquare,
  Mail,
  BookOpen,
  Lock,
  Contact,
} from "lucide-react";

/* ─── Tab types ─── */
type Tab = "schedule" | "timer" | "hub" | "crm" | "reports";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "hub", label: "Hub", icon: MessageSquare },
  { id: "crm", label: "CRM", icon: Contact },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

/* ─── Schedule data ─── */
const BLOCKS = [
  { title: "Acme Corp", time: "8:00 – 10:00", bg: "#dbeafe", border: "#3b82f6", type: "Deep Work" },
  { title: "Natalie Design", time: "10:00 – 10:45", bg: "#d1fae5", border: "#10b981", type: "Support" },
  { title: "Natalie Design", time: "10:45 – 12:45", bg: "#dbeafe", border: "#3b82f6", type: "Deep Work" },
  { title: "Lunch", time: "12:45 – 1:30", bg: "#fce7f3", border: "#ec4899", type: "" },
  { title: "Admin", time: "1:30 – 2:00", bg: "#fef3c7", border: "#f59e0b", type: "" },
  { title: "BrightPath", time: "2:00 – 4:00", bg: "#ede9fe", border: "#8b5cf6", type: "Deep Work" },
  { title: "Acme Corp", time: "4:00 – 4:45", bg: "#d1fae5", border: "#10b981", type: "Support" },
  { title: "Break", time: "4:45 – 5:00", bg: "#f3f4f6", border: "#9ca3af", type: "" },
];

/* ─── Timer data ─── */
const TIMER_ENTRIES = [
  { client: "Acme Corp", project: "Website Redesign", time: "8:02 – 9:58", mins: 116, color: "#3b82f6" },
  { client: "Natalie Design", project: "Brand Guide", time: "10:03 – 10:41", mins: 38, color: "#10b981" },
  { client: "Natalie Design", project: "Brand Guide", time: "10:47 – 12:40", mins: 113, color: "#10b981" },
];

/* ─── Hub data ─── */
const SLACK_MESSAGES = [
  { channel: "#acme-project", from: "Sarah K.", msg: "Can we push the review to 3pm?", unread: true, workspace: "Acme" },
  { channel: "DM", from: "Marcus T.", msg: "Invoice approved, thanks!", unread: true, workspace: "BrightPath" },
  { channel: "#design", from: "Priya R.", msg: "New mockups are in Figma", unread: false, workspace: "Natalie" },
];

const EMAILS = [
  { from: "contracts@acme.co", subject: "Q2 SOW — signature needed", time: "9:14am", unread: true },
  { from: "priya@nataliedesign.com", subject: "Re: Brand colors final", time: "11:22am", unread: false },
];

const NOTION_PAGES = [
  { icon: "📋", title: "Acme — Sprint Board", workspace: "Work" },
  { icon: "🎨", title: "Natalie — Style Guide", workspace: "Work" },
  { icon: "📝", title: "Meeting Notes — Feb 12", workspace: "Personal" },
];

/* ─── CRM data ─── */
const CRM_STAGES = [
  { name: "Lead", color: "#6b7280", contacts: [
    { name: "Startup Inc.", value: "$3,000", activity: "Cold email sent" },
    { name: "GreenTech Co.", value: "$5,000", activity: "Inbound inquiry" },
  ]},
  { name: "Contacted", color: "#3b82f6", contacts: [
    { name: "Nova Labs", value: "$8,000", activity: "Discovery call booked" },
  ]},
  { name: "Proposal", color: "#f59e0b", contacts: [
    { name: "Acme Corp", value: "$12,000", activity: "SOW sent 2 days ago" },
    { name: "BrightPath", value: "$6,500", activity: "Follow-up pending" },
  ]},
  { name: "Won", color: "#10b981", contacts: [
    { name: "Natalie Design", value: "$4,200", activity: "Signed last week" },
  ]},
];

/* ─── Reports data ─── */
const CLIENT_HOURS = [
  { name: "Acme Corp", hours: 18.5, cap: 20, color: "#3b82f6" },
  { name: "Natalie Design", hours: 9.2, cap: 12, color: "#10b981" },
  { name: "BrightPath", hours: 7.8, cap: 10, color: "#8b5cf6" },
];

/* ─── Component ─── */

export function ProductDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [playing, setPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Schedule state
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [showTimeLine, setShowTimeLine] = useState(false);
  const [timeLineProgress, setTimeLineProgress] = useState(0);
  const [lockedBlocks, setLockedBlocks] = useState<number[]>([]);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [visibleEntries, setVisibleEntries] = useState(0);

  // Hub state
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [visibleEmails, setVisibleEmails] = useState(0);
  const [visiblePages, setVisiblePages] = useState(0);

  // CRM state
  const [visibleStages, setVisibleStages] = useState(0);
  const [visibleContacts, setVisibleContacts] = useState<Record<number, number>>({});
  const [pipelineValue, setPipelineValue] = useState(false);

  // Reports state
  const [reportProgress, setReportProgress] = useState(0); // 0-100

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const t = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const resetAll = useCallback(() => {
    setVisibleBlocks(0);
    setShowTimeLine(false);
    setTimeLineProgress(0);
    setLockedBlocks([]);
    setTimerRunning(false);
    setTimerSeconds(0);
    setVisibleEntries(0);
    setVisibleMessages(0);
    setVisibleEmails(0);
    setVisiblePages(0);
    setVisibleStages(0);
    setVisibleContacts({});
    setPipelineValue(false);
    setReportProgress(0);
  }, []);

  // Animate the active tab when it changes
  const animateTab = useCallback((tab: Tab) => {
    clearTimers();
    resetAll();
    setPlaying(true);

    if (tab === "schedule") {
      // Blocks cascade in
      for (let i = 0; i < BLOCKS.length; i++) {
        t(() => setVisibleBlocks(i + 1), 200 + i * 150);
      }
      // Lock a couple blocks
      t(() => setLockedBlocks([0]), 1800);
      t(() => setLockedBlocks([0, 5]), 2200);
      // Time indicator appears
      t(() => {
        setShowTimeLine(true);
        setTimeLineProgress(15);
      }, 2800);
      t(() => setTimeLineProgress(45), 3400);
      t(() => setTimeLineProgress(65), 4200);
      t(() => setPlaying(false), 5000);
    }

    if (tab === "timer") {
      t(() => setTimerRunning(true), 300);
      // Simulate seconds ticking
      for (let s = 1; s <= 8; s++) {
        t(() => setTimerSeconds(s), 300 + s * 250);
      }
      // Entries appear
      t(() => setVisibleEntries(1), 1200);
      t(() => setVisibleEntries(2), 1800);
      t(() => setVisibleEntries(3), 2400);
      t(() => {
        setTimerRunning(false);
        setTimerSeconds(0);
      }, 3200);
      t(() => setPlaying(false), 3800);
    }

    if (tab === "hub") {
      // Slack messages
      t(() => setVisibleMessages(1), 300);
      t(() => setVisibleMessages(2), 700);
      t(() => setVisibleMessages(3), 1100);
      // Emails
      t(() => setVisibleEmails(1), 1600);
      t(() => setVisibleEmails(2), 2000);
      // Notion pages
      t(() => setVisiblePages(1), 2500);
      t(() => setVisiblePages(2), 2800);
      t(() => setVisiblePages(3), 3100);
      t(() => setPlaying(false), 3800);
    }

    if (tab === "crm") {
      // Pipeline columns appear one by one
      for (let i = 0; i < CRM_STAGES.length; i++) {
        t(() => setVisibleStages(i + 1), 300 + i * 350);
        // Contacts cascade in for each stage
        const stage = CRM_STAGES[i];
        for (let j = 0; j < stage.contacts.length; j++) {
          t(() => {
            setVisibleContacts(prev => ({ ...prev, [i]: (prev[i] || 0) + 1 }));
          }, 500 + i * 350 + j * 200);
        }
      }
      // Pipeline value summary
      t(() => setPipelineValue(true), 2200);
      t(() => setPlaying(false), 3000);
    }

    if (tab === "reports") {
      // Progress bars fill
      for (let p = 10; p <= 100; p += 10) {
        t(() => setReportProgress(p), p * 25);
      }
      t(() => setPlaying(false), 3200);
    }
  }, [t, resetAll]);

  // Auto-advance tabs
  useEffect(() => {
    if (!autoAdvance) return;
    const tabOrder: Tab[] = ["schedule", "timer", "hub", "crm", "reports"];
    const idx = tabOrder.indexOf(activeTab);
    const durations: Record<Tab, number> = {
      schedule: 5500,
      timer: 4300,
      hub: 4300,
      crm: 3500,
      reports: 3700,
    };
    const id = setTimeout(() => {
      if (idx < tabOrder.length - 1) {
        const next = tabOrder[idx + 1];
        setActiveTab(next);
        animateTab(next);
      } else {
        setAutoAdvance(false);
        setPlaying(false);
      }
    }, durations[activeTab]);
    return () => clearTimeout(id);
  }, [activeTab, autoAdvance, animateTab]);

  // Auto-play on scroll into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let fired = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired) {
          fired = true;
          observer.disconnect();
          setAutoAdvance(true);
          animateTab("schedule");
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimers(), []);

  const startFullDemo = () => {
    setActiveTab("schedule");
    setAutoAdvance(true);
    animateTab("schedule");
  };

  const selectTab = (tab: Tab) => {
    setAutoAdvance(false);
    setActiveTab(tab);
    animateTab(tab);
  };

  const fmtTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto">
      {/* Demo window */}
      <div className="rounded-xl border bg-white shadow-lg overflow-hidden">
        {/* macOS-style title bar */}
        <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-gray-400 ml-2">MyTime — Workday Manager</span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">11:40 AM</div>
        </div>

        <div className="flex min-h-[420px]">
          {/* Sidebar nav */}
          <div className="w-14 border-r bg-gray-50/80 flex flex-col items-center py-3 gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => selectTab(id)}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                  activeTab === id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[8px] leading-none">{label}</span>
              </button>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 relative overflow-hidden">
            {/* ─── SCHEDULE TAB ─── */}
            {activeTab === "schedule" && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold">Thursday, Feb 12</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {visibleBlocks > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-fade-in">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                {visibleBlocks === 0 && !playing && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <button
                      onClick={startFullDemo}
                      className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Watch the full demo
                    </button>
                  </div>
                )}

                {visibleBlocks === 0 && playing && (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Zap className="h-3.5 w-3.5 animate-pulse" />
                      Generating your schedule...
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {BLOCKS.slice(0, visibleBlocks).map((block, idx) => {
                    const isActive = showTimeLine && idx === 2;
                    const isPast = showTimeLine && idx < 2;
                    const isLocked = lockedBlocks.includes(idx);
                    return (
                      <div key={idx} style={{ animation: "slideIn 0.25s ease-out" }}>
                        <div
                          className="p-2 rounded text-xs relative overflow-visible"
                          style={{
                            backgroundColor: block.bg,
                            borderLeft: `3px solid ${block.border}`,
                            opacity: isPast ? 0.5 : 1,
                            boxShadow: isActive
                              ? "0 0 0 2px rgba(239, 68, 68, 0.3), 0 0 8px rgba(239, 68, 68, 0.15)"
                              : "none",
                            transition: "opacity 0.5s, box-shadow 0.5s",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{block.title}</span>
                            <div className="flex items-center gap-1.5">
                              {block.type && (
                                <span className="text-[10px] opacity-60">{block.type}</span>
                              )}
                              {isLocked && (
                                <Lock className="h-2.5 w-2.5 text-gray-400 animate-fade-in" />
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] opacity-75 mt-0.5">{block.time}</div>

                          {isActive && showTimeLine && (
                            <div
                              className="absolute left-0 right-0 h-[2px] bg-red-500 z-10"
                              style={{
                                top: `${timeLineProgress}%`,
                                transition: "top 0.8s ease-in-out",
                              }}
                            >
                              <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                              <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-red-500">
                                11:40am
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TIMER TAB ─── */}
            {activeTab === "timer" && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                {/* Active timer display */}
                <div className={`rounded-lg border p-4 mb-4 text-center transition-all duration-500 ${
                  timerRunning ? "border-green-300 bg-green-50/50" : "border-gray-200"
                }`}>
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                    {timerRunning ? "Timer Running" : "Ready"}
                  </div>
                  <div className={`text-3xl font-mono font-bold tracking-wider transition-colors duration-300 ${
                    timerRunning ? "text-green-600" : "text-gray-300"
                  }`}>
                    {timerRunning ? `02:45:${String(30 + timerSeconds).padStart(2, "0")}` : fmtTimer(0)}
                  </div>
                  {timerRunning && (
                    <div className="mt-2 flex items-center justify-center gap-2 animate-fade-in">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">Natalie Design — Brand Guide</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                      timerRunning
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}>
                      {timerRunning ? "Stop" : "Start"}
                    </div>
                  </div>
                </div>

                {/* Today's entries */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Today&apos;s Entries
                  </p>
                  <div className="space-y-1.5">
                    {TIMER_ENTRIES.slice(0, visibleEntries).map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-md border bg-white text-xs"
                        style={{ animation: "slideIn 0.25s ease-out" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{entry.client}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-500">{entry.project}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">{entry.time}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 font-medium shrink-0">
                          {Math.floor(entry.mins / 60)}h {entry.mins % 60}m
                        </span>
                      </div>
                    ))}
                  </div>
                  {visibleEntries > 0 && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between animate-fade-in">
                      <span className="text-[10px] font-semibold text-gray-500">Today&apos;s Total</span>
                      <span className="text-xs font-bold">
                        {Math.floor(TIMER_ENTRIES.slice(0, visibleEntries).reduce((a, e) => a + e.mins, 0) / 60)}h{" "}
                        {TIMER_ENTRIES.slice(0, visibleEntries).reduce((a, e) => a + e.mins, 0) % 60}m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── HUB TAB ─── */}
            {activeTab === "hub" && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <div className="grid grid-cols-1 gap-3">
                  {/* Slack section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquare className="h-3 w-3 text-purple-500" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Slack</span>
                      {visibleMessages > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-fade-in">
                          {SLACK_MESSAGES.filter((m, i) => i < visibleMessages && m.unread).length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {SLACK_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-md border text-xs ${
                            msg.unread ? "bg-blue-50/50 border-blue-200" : "bg-white"
                          }`}
                          style={{ animation: "slideIn 0.25s ease-out" }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{msg.channel}</span>
                              <span className="text-[9px] text-gray-400">{msg.workspace}</span>
                            </div>
                            {msg.unread && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-gray-500 mt-0.5">
                            <span className="font-medium text-gray-700">{msg.from}:</span> {msg.msg}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Mail className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Gmail</span>
                      {visibleEmails > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-fade-in">
                          {EMAILS.filter((e, i) => i < visibleEmails && e.unread).length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {EMAILS.slice(0, visibleEmails).map((email, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-md border text-xs ${
                            email.unread ? "bg-red-50/30 border-red-200" : "bg-white"
                          }`}
                          style={{ animation: "slideIn 0.25s ease-out" }}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`${email.unread ? "font-semibold" : "font-medium"}`}>{email.from}</span>
                            <span className="text-[9px] text-gray-400">{email.time}</span>
                          </div>
                          <p className="text-gray-500 mt-0.5 truncate">{email.subject}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notion section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen className="h-3 w-3 text-gray-700" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Notion</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {NOTION_PAGES.slice(0, visiblePages).map((page, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-md border bg-white text-xs text-center"
                          style={{ animation: "slideIn 0.25s ease-out" }}
                        >
                          <div className="text-lg mb-0.5">{page.icon}</div>
                          <p className="font-medium text-[10px] leading-tight truncate">{page.title}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{page.workspace}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CRM TAB ─── */}
            {activeTab === "crm" && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Contact className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold">Pipeline</span>
                  </div>
                  {pipelineValue && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-fade-in">
                      $38,700 total value
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {CRM_STAGES.slice(0, visibleStages).map((stage, si) => (
                    <div
                      key={stage.name}
                      className="min-h-[280px]"
                      style={{ animation: "slideIn 0.25s ease-out" }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                          {stage.name}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {stage.contacts.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {stage.contacts.slice(0, visibleContacts[si] || 0).map((contact, ci) => (
                          <div
                            key={ci}
                            className="p-2 rounded-md border bg-white text-xs"
                            style={{ animation: "slideIn 0.2s ease-out" }}
                          >
                            <div className="font-medium text-[11px] truncate">{contact.name}</div>
                            <div className="text-[10px] font-medium mt-1" style={{ color: stage.color }}>
                              {contact.value}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5 truncate">
                              {contact.activity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── REPORTS TAB ─── */}
            {activeTab === "reports" && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold">Monthly Hours</span>
                  <span className="text-[10px] text-gray-400">February 2026</span>
                </div>

                <div className="space-y-4">
                  {CLIENT_HOURS.map((client) => {
                    const pct = Math.min((client.hours / client.cap) * (reportProgress / 100), 1);
                    const displayHours = (client.hours * reportProgress / 100).toFixed(1);
                    const barColor = pct >= 0.9 ? "#ef4444" : pct >= 0.7 ? "#f59e0b" : client.color;
                    return (
                      <div key={client.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: client.color }}
                            />
                            <span className="text-xs font-medium">{client.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-500">
                            {displayHours}h / {client.cap}h
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct * 100}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-gray-400">
                            {Math.round(pct * 100)}% used
                          </span>
                          {pct >= 0.9 && reportProgress > 80 && (
                            <span className="text-[9px] text-red-500 font-medium animate-fade-in">
                              Near cap
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary cards */}
                {reportProgress >= 80 && (
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t animate-fade-in">
                    <div className="text-center">
                      <p className="text-lg font-bold">35.5h</p>
                      <p className="text-[9px] text-gray-400">Total Tracked</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">$4,437</p>
                      <p className="text-[9px] text-gray-400">Revenue MTD</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">84%</p>
                      <p className="text-[9px] text-gray-400">Utilization</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replay / caption */}
      <div className="text-center mt-4 h-6">
        {!playing && !autoAdvance && (
          <button
            onClick={startFullDemo}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Replay full demo
          </button>
        )}
        {(playing || autoAdvance) && (
          <span className="text-[10px] text-gray-400 animate-pulse">
            {activeTab === "schedule" && "Generate your week in one click"}
            {activeTab === "timer" && "Track time as you work"}
            {activeTab === "hub" && "Slack, Gmail, Notion — all in one place"}
            {activeTab === "crm" && "Track leads and close deals"}
            {activeTab === "reports" && "Know exactly where your hours go"}
          </span>
        )}
      </div>
    </div>
  );
}
