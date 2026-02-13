import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user from the session.
 * Returns the full User record or a 401 response.
 */
export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, res: null };
}

/** Plan hierarchy for feature gating */
const PLAN_LEVEL: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

/** Check if a user's plan meets the minimum required level */
export function hasPlan(userPlan: string, requiredPlan: string): boolean {
  return (PLAN_LEVEL[userPlan] ?? 0) >= (PLAN_LEVEL[requiredPlan] ?? 0);
}

/** Plan feature limits */
export const PLAN_LIMITS = {
  free: { clients: 2, integrations: false, reports: false, export: false, notes: true },
  starter: { clients: 2, integrations: false, reports: false, export: false, notes: true },
  pro: { clients: Infinity, integrations: true, reports: true, export: true, notes: true },
  business: { clients: Infinity, integrations: true, reports: true, export: true, notes: true },
} as const;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
}

/** Require a minimum plan — returns 403 response if plan is insufficient */
export function requirePlan(user: { plan: string }, requiredPlan: string) {
  if (!hasPlan(user.plan, requiredPlan)) {
    return NextResponse.json(
      { error: `This feature requires the ${requiredPlan} plan or higher. Please upgrade.` },
      { status: 403 }
    );
  }
  return null;
}

/** Check client count limit for the user's plan */
export async function checkClientLimit(userId: string, plan: string) {
  const limits = getPlanLimits(plan);
  if (limits.clients === Infinity) return null;

  const count = await prisma.client.count({ where: { userId, archived: false } });
  if (count >= limits.clients) {
    return NextResponse.json(
      { error: `Your plan allows up to ${limits.clients} clients. Please upgrade for unlimited clients.` },
      { status: 403 }
    );
  }
  return null;
}

// ─── Role helpers ──────────────────────────────────────

/** The one and only super admin email */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "justin.sobojinski@gmail.com";

/** Role hierarchy: admin > manager > user */
const ROLE_LEVEL: Record<string, number> = {
  user: 0,
  manager: 1,
  admin: 2,
};

/** Check if a user's role meets the minimum required level */
export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[requiredRole] ?? 0);
}

/** Require admin role — returns 403 response if not admin */
export function requireAdmin(user: { role: string }) {
  if (!hasRole(user.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Require at least manager role — returns 403 response if not manager+ */
export function requireManager(user: { role: string }) {
  if (!hasRole(user.role, "manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
