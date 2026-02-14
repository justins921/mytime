"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Printer,
  RotateCcw,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Users,
  CheckSquare,
  Timer,
  StickyNote,
  Contact,
  MessageSquare,
  Mail,
  BookOpen,
  Inbox,
  BarChart3,
  Settings,
  Shield,
  CreditCard,
  LogIn,
  Globe,
  type LucideIcon,
} from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  description?: string;
};

type ChecklistSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: ChecklistItem[];
};

const STORAGE_KEY = "mytime-qa-checklist";

const sections: ChecklistSection[] = [
  {
    id: "auth",
    title: "Authentication & Accounts",
    icon: LogIn,
    items: [
      { id: "auth-signup", label: "Sign up with new account", description: "Fill out registration form, verify email is sent" },
      { id: "auth-login", label: "Log in with valid credentials" },
      { id: "auth-login-fail", label: "Log in with invalid credentials shows error" },
      { id: "auth-forgot-pw", label: "Forgot password flow sends reset email" },
      { id: "auth-reset-pw", label: "Reset password link works and updates password" },
      { id: "auth-change-pw", label: "Change password from settings works" },
      { id: "auth-logout", label: "Sign out clears session and redirects" },
      { id: "auth-session", label: "Session persists across page refreshes" },
      { id: "auth-protected", label: "Unauthenticated users redirected to login" },
    ],
  },
  {
    id: "schedule",
    title: "Schedule",
    icon: Calendar,
    items: [
      { id: "sched-view", label: "Weekly schedule loads and displays correctly" },
      { id: "sched-nav", label: "Navigate between weeks (prev/next)" },
      { id: "sched-generate", label: "Generate schedule creates blocks for the week" },
      { id: "sched-lock", label: "Lock/unlock individual schedule blocks" },
      { id: "sched-delete", label: "Delete a schedule block" },
      { id: "sched-float-add", label: "Add a floating task" },
      { id: "sched-float-status", label: "Change floating task status (pending/scheduled/completed)" },
      { id: "sched-float-delete", label: "Delete a floating task" },
      { id: "sched-timeoff", label: "Schedule generation respects time-off days" },
      { id: "sched-calendar", label: "Calendar feed events display on schedule" },
      { id: "sched-empty", label: "Empty state shows when no blocks exist" },
    ],
  },
  {
    id: "clients",
    title: "Clients",
    icon: Users,
    items: [
      { id: "client-list", label: "Client list loads and displays" },
      { id: "client-add", label: "Add a new client with all fields", description: "Name, retainer, rate, weekly target, cap, priority, style, color" },
      { id: "client-edit", label: "Edit existing client details" },
      { id: "client-delete", label: "Delete a client (cascades projects/tasks)" },
      { id: "client-daily-touch", label: "Toggle daily touch flag" },
      { id: "client-detail", label: "Client detail page shows projects and tasks" },
      { id: "client-styles", label: "Client styles display correctly (DeepWork, Support, Mixed, Personal)" },
      { id: "client-color", label: "Client color picker works and persists" },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    icon: CheckSquare,
    items: [
      { id: "proj-list", label: "Projects load under their client" },
      { id: "proj-add", label: "Create a new project under a client" },
      { id: "proj-edit", label: "Edit project name, tags, weight" },
      { id: "proj-archive", label: "Archive/unarchive a project" },
      { id: "proj-delete", label: "Delete a project" },
    ],
  },
  {
    id: "tasks",
    title: "Tasks",
    icon: CheckSquare,
    items: [
      { id: "task-list", label: "Task list view loads" },
      { id: "task-kanban", label: "Kanban board view loads and displays columns" },
      { id: "task-add", label: "Quick-add a new task", description: "Title, client, project, priority, estimate, due date" },
      { id: "task-edit", label: "Edit task details" },
      { id: "task-status", label: "Change task status (Backlog/InProgress/Done)" },
      { id: "task-drag", label: "Drag tasks between kanban columns (if supported)" },
      { id: "task-priority", label: "Priority badges display correctly (P1/P2/P3)" },
      { id: "task-delete", label: "Delete a task" },
      { id: "task-filter", label: "Filter/sort tasks by client or priority" },
    ],
  },
  {
    id: "timer",
    title: "Timer & Time Tracking",
    icon: Timer,
    items: [
      { id: "timer-start", label: "Start a new timer" },
      { id: "timer-stop", label: "Stop an active timer creates a time entry" },
      { id: "timer-running", label: "Timer displays elapsed time in real-time" },
      { id: "timer-manual", label: "Add a manual time entry" },
      { id: "timer-client", label: "Assign time entry to client/project/task" },
      { id: "timer-notes", label: "Add notes to a time entry" },
      { id: "timer-history", label: "Time entry history loads and displays" },
      { id: "timer-monthly", label: "Monthly hours per client aggregation works" },
      { id: "timer-edit", label: "Edit an existing time entry" },
      { id: "timer-delete", label: "Delete a time entry" },
    ],
  },
  {
    id: "notes",
    title: "Notes",
    icon: StickyNote,
    items: [
      { id: "note-list", label: "Notes list loads" },
      { id: "note-add", label: "Create a new note with title and content" },
      { id: "note-edit", label: "Edit an existing note" },
      { id: "note-pin", label: "Pin/unpin a note" },
      { id: "note-client", label: "Associate note with a client" },
      { id: "note-delete", label: "Delete a note" },
      { id: "note-sort", label: "Note sort order works" },
    ],
  },
  {
    id: "crm",
    title: "CRM",
    icon: Contact,
    items: [
      { id: "crm-list", label: "Contact list/pipeline loads" },
      { id: "crm-add", label: "Add a new CRM contact" },
      { id: "crm-edit", label: "Edit contact details" },
      { id: "crm-pipeline", label: "Move contacts through pipeline stages" },
      { id: "crm-activity", label: "Log an activity (email, call, meeting, etc.)" },
      { id: "crm-activity-list", label: "Activity history loads for a contact" },
      { id: "crm-template", label: "Create a contract template with merge fields" },
      { id: "crm-contract", label: "Generate a contract from template for a contact" },
      { id: "crm-delete", label: "Delete a contact" },
    ],
  },
  {
    id: "messages",
    title: "Messages (Slack) — Pro+",
    icon: MessageSquare,
    items: [
      { id: "msg-gate", label: "Feature gated for free users (shows upgrade)" },
      { id: "msg-oauth", label: "Slack OAuth flow connects workspace" },
      { id: "msg-workspaces", label: "Connected workspaces display" },
      { id: "msg-conversations", label: "Slack conversations/channels load" },
      { id: "msg-messages", label: "Messages within a conversation load" },
      { id: "msg-context", label: "Context panel shows relevant info" },
      { id: "msg-disconnect", label: "Disconnect a Slack workspace" },
    ],
  },
  {
    id: "email",
    title: "Email (Gmail/Outlook) — Pro+",
    icon: Mail,
    items: [
      { id: "email-gate", label: "Feature gated for free users (shows upgrade)" },
      { id: "email-gmail-oauth", label: "Gmail OAuth flow connects account" },
      { id: "email-outlook-oauth", label: "Outlook OAuth flow connects account" },
      { id: "email-accounts", label: "Connected email accounts display" },
      { id: "email-inbox", label: "Emails load in inbox view" },
      { id: "email-cards", label: "Email cards/kanban functionality works (Gmail)" },
      { id: "email-send", label: "Send/reply to an email" },
      { id: "email-archive", label: "Archive an email (Gmail)" },
      { id: "email-disconnect", label: "Disconnect an email account" },
    ],
  },
  {
    id: "notion",
    title: "Notion — Pro+",
    icon: BookOpen,
    items: [
      { id: "notion-gate", label: "Feature gated for free users (shows upgrade)" },
      { id: "notion-connect", label: "Connect Notion workspace with API token" },
      { id: "notion-pages", label: "Notion pages load and display" },
      { id: "notion-search", label: "Search Notion pages" },
      { id: "notion-fav", label: "Add/remove favorite pages" },
      { id: "notion-disconnect", label: "Disconnect Notion workspace" },
    ],
  },
  {
    id: "triage",
    title: "Triage (Task Import) — Pro+",
    icon: Inbox,
    items: [
      { id: "triage-gate", label: "Feature gated for free users (shows upgrade)" },
      { id: "triage-clickup", label: "ClickUp tasks import and display" },
      { id: "triage-trello", label: "Trello tasks import and display" },
      { id: "triage-asana", label: "Asana tasks import and display" },
      { id: "triage-monday", label: "Monday tasks import and display" },
      { id: "triage-dismiss", label: "Dismiss a triaged task" },
      { id: "triage-import", label: "Import a triaged task into Work OS tasks" },
    ],
  },
  {
    id: "reports",
    title: "Reports — Pro+",
    icon: BarChart3,
    items: [
      { id: "reports-gate", label: "Feature gated for free users (shows upgrade)" },
      { id: "reports-load", label: "Reports page loads with analytics data" },
      { id: "reports-filter", label: "Filter reports by date range" },
      { id: "reports-client", label: "Filter reports by client" },
      { id: "reports-csv", label: "Export report as CSV" },
      { id: "reports-pdf", label: "Export report as PDF" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    items: [
      { id: "set-load", label: "Settings page loads" },
      { id: "set-timezone", label: "Change timezone" },
      { id: "set-availability", label: "Set weekly availability hours" },
      { id: "set-calendar-add", label: "Add a calendar feed (ICS URL)" },
      { id: "set-calendar-sync", label: "Sync calendar feed fetches events" },
      { id: "set-calendar-color", label: "Change calendar feed color" },
      { id: "set-calendar-toggle", label: "Enable/disable a calendar feed" },
      { id: "set-calendar-delete", label: "Delete a calendar feed" },
      { id: "set-timeoff-add", label: "Add time-off entry (vacation, sick day, etc.)" },
      { id: "set-timeoff-delete", label: "Delete a time-off entry" },
      { id: "set-integrations", label: "Integration tokens save and persist" },
    ],
  },
  {
    id: "billing",
    title: "Billing & Stripe",
    icon: CreditCard,
    items: [
      { id: "bill-plans", label: "Plan selection/pricing displays" },
      { id: "bill-checkout", label: "Stripe checkout session creates and redirects" },
      { id: "bill-webhook", label: "Stripe webhook updates user plan on payment" },
      { id: "bill-portal", label: "Billing portal opens for managing subscription" },
      { id: "bill-cancel", label: "Subscription cancellation updates plan" },
      { id: "bill-upgrade", label: "Upgrade between plans works correctly" },
      { id: "bill-feature-gate", label: "Plan-gated features lock/unlock properly" },
    ],
  },
  {
    id: "admin",
    title: "Admin Panel",
    icon: Shield,
    items: [
      { id: "admin-access", label: "Admin page restricted to admin/manager/owner" },
      { id: "admin-dash", label: "Dashboard metrics load (users, paid, conversion, etc.)" },
      { id: "admin-users", label: "User list loads with roles and plans" },
      { id: "admin-role", label: "Change a user's role" },
      { id: "admin-plan", label: "Change a user's plan" },
      { id: "admin-impersonate", label: "Impersonate a user and verify context switch" },
      { id: "admin-delete-user", label: "Delete a user and verify cascade" },
      { id: "admin-tickets", label: "Support tickets load with status" },
      { id: "admin-ticket-status", label: "Change support ticket status" },
      { id: "admin-kb-create", label: "Create a knowledge base article" },
      { id: "admin-kb-edit", label: "Edit a knowledge base article" },
      { id: "admin-kb-publish", label: "Publish/unpublish an article" },
      { id: "admin-kb-delete", label: "Delete a knowledge base article" },
      { id: "admin-landing", label: "Landing page editor loads and saves" },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: MessageSquare,
    items: [
      { id: "sup-load", label: "Support page loads" },
      { id: "sup-submit", label: "Submit a support ticket (bug, feature, feedback, etc.)" },
      { id: "sup-types", label: "All ticket types selectable" },
      { id: "sup-confirm", label: "Confirmation shown after submission" },
    ],
  },
  {
    id: "ui",
    title: "UI & Layout",
    icon: Globe,
    items: [
      { id: "ui-sidebar", label: "Sidebar navigation renders all links" },
      { id: "ui-sidebar-active", label: "Active page highlighted in sidebar" },
      { id: "ui-sidebar-mobile", label: "Mobile menu hamburger opens/closes sidebar" },
      { id: "ui-sidebar-overlay", label: "Mobile overlay dismisses sidebar" },
      { id: "ui-sidebar-badges", label: "Unread count badges display on Messages/Support" },
      { id: "ui-locked", label: "Locked features show lock icon and upgrade modal" },
      { id: "ui-upgrade-modal", label: "Upgrade modal displays with 'View Plans' button" },
      { id: "ui-responsive", label: "All pages are responsive on mobile" },
      { id: "ui-loading", label: "Loading states display while data fetches" },
      { id: "ui-empty", label: "Empty states display when no data" },
      { id: "ui-landing", label: "Landing page renders for unauthenticated users" },
    ],
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    icon: Shield,
    items: [
      { id: "role-user", label: "Regular user cannot access admin routes" },
      { id: "role-manager", label: "Manager can access admin panel" },
      { id: "role-admin", label: "Admin can access admin panel and manage users" },
      { id: "role-owner", label: "Owner has full access including dev notes" },
      { id: "role-api-403", label: "API routes return 403 for insufficient roles" },
      { id: "role-impersonate", label: "Impersonation only available to admin/owner" },
    ],
  },
];

export default function QAChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.role !== "admin" && data.role !== "owner") {
          setForbidden(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setForbidden(true);
        setLoading(false);
      });

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setChecked(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  function toggleItem(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function toggleSection(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function resetAll() {
    if (!confirm("Reset all checklist progress? This cannot be undone.")) return;
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  }

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">You need admin or owner access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          /* Hide non-essential UI */
          nav, aside, header, footer,
          button[data-print-hide],
          [data-print-hide] {
            display: none !important;
          }
          /* Reset layout for print */
          body, main, .md\\:ml-56 {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Page setup */
          @page {
            margin: 0.5in;
            size: letter;
          }
          /* Typography for print */
          .print-title {
            font-size: 18pt !important;
            font-weight: bold !important;
            margin-bottom: 4pt !important;
          }
          .print-subtitle {
            font-size: 10pt !important;
            color: #666 !important;
            margin-bottom: 12pt !important;
          }
          /* Section headers */
          .qa-section {
            break-inside: avoid;
            margin-bottom: 8pt !important;
            border: 1px solid #ddd !important;
            border-radius: 6px !important;
            padding: 8pt !important;
          }
          .qa-section-header {
            font-size: 11pt !important;
            font-weight: 600 !important;
            border-bottom: 1px solid #eee !important;
            padding-bottom: 4pt !important;
            margin-bottom: 6pt !important;
          }
          /* Checklist items */
          .qa-item {
            font-size: 9pt !important;
            padding: 2pt 0 !important;
            break-inside: avoid;
          }
          .qa-item-desc {
            font-size: 8pt !important;
            color: #888 !important;
          }
          /* Show checkboxes as printable squares */
          .qa-checkbox-print {
            display: inline-block !important;
            width: 11px !important;
            height: 11px !important;
            border: 1.5px solid #333 !important;
            border-radius: 2px !important;
            margin-right: 6px !important;
            vertical-align: middle !important;
            position: relative !important;
          }
          .qa-checkbox-print.checked::after {
            content: "\\2713" !important;
            position: absolute !important;
            top: -3px !important;
            left: 1px !important;
            font-size: 10px !important;
            font-weight: bold !important;
          }
          .qa-checkbox-screen {
            display: none !important;
          }
          /* Progress bar */
          .qa-progress-bar {
            display: none !important;
          }
          /* Force all sections open for print */
          .qa-section-body {
            display: block !important;
            max-height: none !important;
          }
          /* Section stats */
          .qa-section-stats {
            font-size: 8pt !important;
            color: #999 !important;
          }
        }
        @media screen {
          .qa-checkbox-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold print-title">QA Checklist</h1>
            <p className="text-sm text-muted-foreground mt-1 print-subtitle">
              Quality control checklist for testing all Work OS features. Progress saves automatically.
            </p>
          </div>
          <div className="flex items-center gap-2" data-print-hide>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="qa-progress-bar rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Overall Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {checkedCount} / {totalItems} items ({progressPct}%)
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isCollapsed = collapsed[section.id];
            const sectionChecked = section.items.filter((item) => checked[item.id]).length;
            const sectionTotal = section.items.length;
            const sectionDone = sectionChecked === sectionTotal;

            return (
              <div key={section.id} className="qa-section rounded-lg border bg-card overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="qa-section-header w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  data-print-hide="false"
                >
                  <span className="qa-checkbox-screen">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <Icon className={`h-4 w-4 shrink-0 ${sectionDone ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <span className={`flex-1 text-sm font-semibold ${sectionDone ? "text-emerald-600" : ""}`}>
                    {section.title}
                  </span>
                  <span className={`qa-section-stats text-xs font-medium px-2 py-0.5 rounded-full ${
                    sectionDone
                      ? "bg-emerald-100 text-emerald-700"
                      : sectionChecked > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {sectionChecked}/{sectionTotal}
                  </span>
                </button>

                {/* Section items */}
                {!isCollapsed && (
                  <div className="qa-section-body border-t divide-y">
                    {section.items.map((item) => {
                      const isChecked = !!checked[item.id];
                      return (
                        <label
                          key={item.id}
                          className="qa-item flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                        >
                          {/* Screen checkbox */}
                          <span className="qa-checkbox-screen mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </span>
                          {/* Print checkbox */}
                          <span className={`qa-checkbox-print ${isChecked ? "checked" : ""}`} />
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(item.id)}
                            className="sr-only"
                          />
                          <span className="flex-1 min-w-0">
                            <span className={`text-sm ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="qa-item-desc block text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground" data-print-hide>
          Checklist progress is saved to your browser. Use &ldquo;Reset&rdquo; to start over.
        </div>
      </div>
    </>
  );
}
