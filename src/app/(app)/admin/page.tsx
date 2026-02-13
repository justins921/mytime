"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  MessageSquare,
  Clock,
  ChevronDown,
  Bug,
  Lightbulb,
  Plug,
  HelpCircle,
  BarChart3,
  BookOpen,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Save,
  X,
  TrendingUp,
  DollarSign,
  Briefcase,
  FolderKanban,
  Timer,
  CalendarCheck,
  Ticket,
  ArrowUpRight,
  Star,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
  _count: { clients: number; timeEntries: number; supportTickets: number };
};

type TicketRow = {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

type DashboardData = {
  totalUsers: number;
  paidUsers: number;
  plans: Record<string, number>;
  conversionRate: number;
  churnedUsers: number;
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  totalHours: number;
  totalTimeEntries: number;
  schedulesGenerated: number;
  totalSupportTickets: number;
  openTickets: number;
  signupTrend: { month: string; count: number }[];
};

type KBArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string;
  relatedTicketTypes: string;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Constants ─────────────────────────────────────

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: ShieldAlert,
  manager: ShieldCheck,
  user: Shield,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-amber-100 text-amber-700",
  user: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const TICKET_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  integration: Plug,
  feedback: MessageSquare,
  testimonial: Star,
  support: HelpCircle,
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  business: "bg-emerald-100 text-emerald-700",
};

const KB_CATEGORIES = [
  { value: "getting-started", label: "Getting Started" },
  { value: "features", label: "Features" },
  { value: "integrations", label: "Integrations" },
  { value: "billing", label: "Billing" },
  { value: "troubleshooting", label: "Troubleshooting" },
];

const KB_TICKET_TYPES = ["bug", "feature", "integration", "feedback", "testimonial", "support"];

// ─── Component ─────────────────────────────────────

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "users" | "support" | "kb">("dashboard");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // KB editor state
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [kbForm, setKbForm] = useState({
    title: "",
    content: "",
    category: "getting-started",
    tags: "",
    relatedTicketTypes: "",
    status: "draft",
  });
  const [savingKb, setSavingKb] = useState(false);

  const loadArticles = useCallback(async () => {
    try {
      const data = await fetch("/api/admin/kb").then((r) => r.json());
      if (Array.isArray(data)) setArticles(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => {
        if (r.status === 403) { setForbidden(true); return []; }
        return r.json();
      }),
      fetch("/api/admin/support").then((r) => {
        if (r.status === 403) return [];
        return r.json();
      }),
      fetch("/api/admin/dashboard").then((r) => {
        if (r.status === 403) return null;
        return r.json();
      }),
      fetch("/api/admin/kb").then((r) => {
        if (r.status === 403) return [];
        return r.json();
      }),
    ]).then(([u, t, d, a]) => {
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(t)) setTickets(t);
      if (d && !d.error) setDashboard(d);
      if (Array.isArray(a)) setArticles(a);
      setLoading(false);
    });
  }, []);

  async function changeRole(userId: string, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This will permanently delete all their data.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  }

  async function changeTicketStatus(ticketId: string, status: string) {
    const res = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    }
  }

  // KB functions
  function startNewArticle() {
    setEditingArticle(null);
    setKbForm({
      title: "",
      content: "",
      category: "getting-started",
      tags: "",
      relatedTicketTypes: "",
      status: "draft",
    });
  }

  function startEditArticle(article: KBArticle) {
    setEditingArticle(article);
    setKbForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags,
      relatedTicketTypes: article.relatedTicketTypes,
      status: article.status,
    });
  }

  function startArticleFromTicket(ticket: TicketRow) {
    setTab("kb");
    setEditingArticle(null);
    const category = ticket.type === "bug" ? "troubleshooting" :
      ticket.type === "integration" ? "integrations" :
      ticket.type === "feature" ? "features" :
      ticket.type === "testimonial" ? "getting-started" : "getting-started";
    setKbForm({
      title: ticket.subject,
      content: `## ${ticket.subject}\n\n${ticket.message}\n\n---\n*Generated from support ticket*`,
      category,
      tags: ticket.type,
      relatedTicketTypes: ticket.type,
      status: "draft",
    });
  }

  async function saveArticle() {
    if (!kbForm.title || !kbForm.content || !kbForm.category) return;
    setSavingKb(true);
    try {
      if (editingArticle) {
        const res = await fetch("/api/admin/kb", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingArticle.id, ...kbForm }),
        });
        if (res.ok) {
          await loadArticles();
          setEditingArticle(null);
          setKbForm({ title: "", content: "", category: "getting-started", tags: "", relatedTicketTypes: "", status: "draft" });
        }
      } else {
        const res = await fetch("/api/admin/kb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kbForm),
        });
        if (res.ok) {
          await loadArticles();
          setKbForm({ title: "", content: "", category: "getting-started", tags: "", relatedTicketTypes: "", status: "draft" });
        }
      }
    } catch {
      // ignore
    }
    setSavingKb(false);
  }

  async function deleteArticle(id: string) {
    if (!confirm("Delete this article?")) return;
    const res = await fetch("/api/admin/kb", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setArticles(articles.filter((a) => a.id !== id));
    }
  }

  async function toggleArticleStatus(article: KBArticle) {
    const newStatus = article.status === "published" ? "draft" : "published";
    const res = await fetch("/api/admin/kb", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: article.id, status: newStatus }),
    });
    if (res.ok) {
      setArticles(articles.map((a) => (a.id === article.id ? { ...a, status: newStatus } : a)));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">You need admin or manager access to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform metrics, user management, support, and knowledge base.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        <button
          onClick={() => setTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab("support")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === "support" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Support ({tickets.filter((t) => t.status === "open" || t.status === "in_progress").length} open)
        </button>
        <button
          onClick={() => setTab("kb")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === "kb" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Knowledge Base ({articles.length})
        </button>
      </div>

      {/* ─── Dashboard Tab ─── */}
      {tab === "dashboard" && dashboard && (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={Users} label="Total Users" value={dashboard.totalUsers} />
            <MetricCard icon={DollarSign} label="Paid Users" value={dashboard.paidUsers} accent="text-emerald-600" />
            <MetricCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={`${(dashboard.conversionRate * 100).toFixed(1)}%`}
              accent="text-blue-600"
            />
            <MetricCard
              icon={ArrowUpRight}
              label="Churned Users"
              value={dashboard.churnedUsers}
              accent={dashboard.churnedUsers > 0 ? "text-red-600" : "text-emerald-600"}
            />
          </div>

          {/* Plan breakdown */}
          <div className="rounded-lg border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Plan Breakdown</h3>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(dashboard.plans).map(([plan, count]) => (
                <div key={plan} className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}>
                    {plan}
                  </span>
                  <span className="text-sm font-semibold">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({dashboard.totalUsers > 0 ? ((count / dashboard.totalUsers) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard icon={Briefcase} label="Total Clients" value={dashboard.totalClients} />
            <MetricCard icon={FolderKanban} label="Total Projects" value={dashboard.totalProjects} />
            <MetricCard icon={Timer} label="Hours Logged" value={dashboard.totalHours.toLocaleString()} accent="text-blue-600" />
            <MetricCard icon={CalendarCheck} label="Schedules Generated" value={dashboard.schedulesGenerated.toLocaleString()} />
            <MetricCard icon={Ticket} label="Support Tickets" value={`${dashboard.openTickets} open / ${dashboard.totalSupportTickets}`} />
          </div>

          {/* Signup trend */}
          {dashboard.signupTrend.length > 0 && (
            <div className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">User Signups (Last 12 Months)</h3>
              <div className="flex items-end gap-1 h-32">
                {dashboard.signupTrend.map((point) => {
                  const max = Math.max(...dashboard.signupTrend.map((p) => p.count), 1);
                  const height = (point.count / max) * 100;
                  return (
                    <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{point.count}</span>
                      <div
                        className="w-full bg-primary/80 rounded-t min-h-[2px]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground -rotate-45 origin-top-left mt-1">
                        {point.month.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "dashboard" && !dashboard && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Failed to load dashboard metrics.
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {tab === "users" && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-center px-4 py-3 font-medium">Clients</th>
                  <th className="text-center px-4 py-3 font-medium">Entries</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] || Shield;
                  return (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.name || "\u2014"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                          <RoleIcon className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PLAN_COLORS[u.plan] || PLAN_COLORS.free}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{u._count.clients}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{u._count.timeEntries}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1 bg-background"
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => deleteUser(u.id, u.email)}
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Support Tab ─── */}
      {tab === "support" && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No support tickets yet.</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const TicketIcon = TICKET_ICONS[ticket.type] || HelpCircle;
              const expanded = expandedTicket === ticket.id;
              return (
                <div key={ticket.id} className="rounded-lg border bg-card">
                  <button
                    onClick={() => setExpandedTicket(expanded ? null : ticket.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <TicketIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ticket.user.name || ticket.user.email} &middot;{" "}
                        {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="border-t px-4 py-3 space-y-3">
                      <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">{ticket.message}</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleString()}
                        </div>
                        <span className="text-xs text-muted-foreground">from {ticket.user.email}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => startArticleFromTicket(ticket)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <BookOpen className="h-3 w-3" />
                            Create KB Article
                          </button>
                          <label className="text-xs text-muted-foreground">Status:</label>
                          <select
                            value={ticket.status}
                            onChange={(e) => changeTicketStatus(ticket.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1 bg-background"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Knowledge Base Tab ─── */}
      {tab === "kb" && (
        <div className="space-y-4">
          {/* Editor / New Article form */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {editingArticle ? `Editing: ${editingArticle.title}` : "New Article"}
              </h3>
              <div className="flex items-center gap-2">
                {editingArticle && (
                  <button
                    onClick={() => {
                      setEditingArticle(null);
                      setKbForm({ title: "", content: "", category: "getting-started", tags: "", relatedTicketTypes: "", status: "draft" });
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {!editingArticle && !kbForm.title && (
                  <button
                    onClick={startNewArticle}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Article
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title</label>
                <input
                  type="text"
                  value={kbForm.title}
                  onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Article title"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <select
                  value={kbForm.category}
                  onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {KB_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Content (Markdown)</label>
              <textarea
                value={kbForm.content}
                onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 text-sm rounded-md border font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                placeholder="Write your article content in Markdown..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={kbForm.tags}
                  onChange={(e) => setKbForm({ ...kbForm, tags: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="timer, schedule, billing"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Related Ticket Types</label>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {KB_TICKET_TYPES.map((t) => {
                    const selected = kbForm.relatedTicketTypes.split(",").map((s) => s.trim()).includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const current = kbForm.relatedTicketTypes.split(",").map((s) => s.trim()).filter(Boolean);
                          const next = selected ? current.filter((c) => c !== t) : [...current, t];
                          setKbForm({ ...kbForm, relatedTicketTypes: next.join(",") });
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Status</label>
                <select
                  value={kbForm.status}
                  onChange={(e) => setKbForm({ ...kbForm, status: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={saveArticle}
                disabled={savingKb || !kbForm.title || !kbForm.content}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {savingKb ? "Saving..." : editingArticle ? "Update Article" : "Create Article"}
              </button>
            </div>
          </div>

          {/* Articles list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              All Articles ({articles.length})
            </h3>
            {articles.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No articles yet. Create your first one above.</p>
              </div>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="rounded-lg border bg-card px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{article.title}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          article.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {article.status}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {KB_CATEGORIES.find((c) => c.value === article.category)?.label || article.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        /{article.slug} &middot; Updated {new Date(article.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {article.tags && ` \u00b7 ${article.tags}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleArticleStatus(article)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title={article.status === "published" ? "Unpublish" : "Publish"}
                      >
                        {article.status === "published" ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => startEditArticle(article)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Metric Card Component ─────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${accent || "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${accent || ""}`}>{value}</p>
    </div>
  );
}
