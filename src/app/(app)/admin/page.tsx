"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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
  support: HelpCircle,
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [tab, setTab] = useState<"users" | "support">("users");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

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
    ]).then(([u, t]) => {
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(t)) setTickets(t);
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
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, roles, and support tickets.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab("support")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "support" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Support ({tickets.filter((t) => t.status === "open" || t.status === "in_progress").length} open)
        </button>
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="rounded-lg border bg-card overflow-hidden">
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
                      <p className="font-medium">{u.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                        <RoleIcon className="h-3 w-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium capitalize">{u.plan}</span>
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
      )}

      {/* Support tab */}
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
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleString()}
                        </div>
                        <span className="text-xs text-muted-foreground">from {ticket.user.email}</span>
                        <div className="ml-auto flex items-center gap-2">
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
    </div>
  );
}
