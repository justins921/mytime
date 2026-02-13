"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  CheckSquare,
  Timer,
  BarChart3,
  Settings,
  Menu,
  X,
  Inbox,
  MessageSquare,
  Mail,
  StickyNote,
  BookOpen,
  LogOut,
  HelpCircle,
  ShieldAlert,
  Lock,
  Contact,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

// requiredPlan: "free" = everyone, "pro" = pro+, "business" = business only
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPlan: "free" | "pro" | "business";
};

const navItems: NavItem[] = [
  { href: "/schedule", label: "Schedule", icon: Calendar, requiredPlan: "free" },
  { href: "/clients", label: "Clients", icon: Users, requiredPlan: "free" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, requiredPlan: "free" },
  { href: "/timer", label: "Timer", icon: Timer, requiredPlan: "free" },
  { href: "/notes", label: "Notes", icon: StickyNote, requiredPlan: "free" },
  { href: "/crm", label: "CRM", icon: Contact, requiredPlan: "free" },
  { href: "/messages", label: "Messages", icon: MessageSquare, requiredPlan: "pro" },
  { href: "/email", label: "Email", icon: Mail, requiredPlan: "pro" },
  { href: "/notion", label: "Notion", icon: BookOpen, requiredPlan: "pro" },
  { href: "/triage", label: "Triage", icon: Inbox, requiredPlan: "pro" },
  { href: "/reports", label: "Reports", icon: BarChart3, requiredPlan: "pro" },
  { href: "/support", label: "Support", icon: HelpCircle, requiredPlan: "free" },
  { href: "/settings", label: "Settings", icon: Settings, requiredPlan: "free" },
];

const PLAN_LEVEL: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3 };

function hasAccess(userPlan: string, requiredPlan: string): boolean {
  return (PLAN_LEVEL[userPlan] ?? 0) >= (PLAN_LEVEL[requiredPlan] ?? 0);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState("free");
  const [showUpgrade, setShowUpgrade] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/stripe/plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "admin" || data.role === "manager" || data.role === "owner") {
          setIsAdmin(true);
        }
        if (data.plan) setPlan(data.plan);
      })
      .catch(() => {});

    function fetchUnreads() {
      fetch("/api/notifications/unread")
        .then((r) => r.json())
        .then((data) => {
          const counts: Record<string, number> = {};
          if (data.messages > 0) counts["/messages"] = data.messages;
          if (data.support > 0) counts["/support"] = data.support;
          setUnreadCounts(counts);
        })
        .catch(() => {});
    }

    fetchUnreads();
    const interval = setInterval(fetchUnreads, 60000);
    return () => clearInterval(interval);
  }, []);

  const allItems: NavItem[] = isAdmin
    ? [
        ...navItems,
        { href: "/admin", label: "Admin", icon: ShieldAlert, requiredPlan: "free" as const },
        { href: "/qa-checklist", label: "QA Checklist", icon: ClipboardCheck, requiredPlan: "free" as const },
      ]
    : navItems;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-50 p-2 rounded-md bg-background border md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowUpgrade(null)}>
          <div className="bg-background rounded-lg border shadow-lg p-6 max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Upgrade Required</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>{showUpgrade}</strong> requires a Pro plan or higher.
              Upgrade to unlock all features including integrations, reports, notes, and more.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowUpgrade(null);
                  setOpen(false);
                  router.push("/settings");
                }}
                className="flex-1 bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors"
              >
                View Plans
              </button>
              <button
                onClick={() => setShowUpgrade(null)}
                className="px-4 py-2 rounded-md text-sm border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-56 bg-background border-r transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">MyTime</h1>
          <p className="text-xs text-muted-foreground">Workday Manager</p>
        </div>
        <nav className="p-2 space-y-1">
          {allItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            const locked = !isAdmin && !hasAccess(plan, item.requiredPlan);

            if (locked) {
              return (
                <button
                  key={item.href}
                  onClick={() => setShowUpgrade(item.label)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-left text-muted-foreground/50 hover:bg-accent/50 transition-colors"
                >
                  <Icon className="h-4 w-4 opacity-40" />
                  <span className="flex-1 opacity-50">{item.label}</span>
                  <Lock className="h-3 w-3 opacity-40" />
                </button>
              );
            }

            const count = unreadCounts[item.href] || 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                    active
                      ? "bg-primary-foreground text-primary"
                      : "bg-red-500 text-white"
                  )}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
