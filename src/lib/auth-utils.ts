import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Get the authenticated user from the session.
 * If an admin is impersonating another user (via cookie), returns
 * the impersonated user instead, along with impersonation metadata.
 */
export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), impersonating: false };
  }

  const realUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!realUser) {
    return { user: null, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), impersonating: false };
  }

  // Check for admin/owner impersonation
  if (hasRole(realUser.role, "admin")) {
    try {
      const cookieStore = await cookies();
      const targetId = cookieStore.get("impersonate_user_id")?.value;
      if (targetId && targetId !== realUser.id) {
        const impersonatedUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (impersonatedUser) {
          return { user: impersonatedUser, res: null, impersonating: true, realUser };
        }
      }
    } catch {
      // cookies() can throw in some contexts — fall through to normal flow
    }
  }

  return { user: realUser, res: null, impersonating: false };
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

/** Require a minimum plan — returns 403 response if plan is insufficient. Admins/owners bypass. */
export function requirePlan(user: { plan: string; role: string }, requiredPlan: string) {
  if (hasRole(user.role, "admin")) return null;
  if (!hasPlan(user.plan, requiredPlan)) {
    return NextResponse.json(
      { error: `This feature requires the ${requiredPlan} plan or higher. Please upgrade.` },
      { status: 403 }
    );
  }
  return null;
}

/** Check client count limit for the user's plan. Admins/owners bypass. */
export async function checkClientLimit(userId: string, plan: string, role: string) {
  if (hasRole(role, "admin")) return null;
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

/** The one and only owner email */
export const OWNER_EMAIL = process.env.ADMIN_EMAIL || "justin.sobojinski@gmail.com";

/** @deprecated Use OWNER_EMAIL instead */
export const ADMIN_EMAIL = OWNER_EMAIL;

/** Role hierarchy: owner > admin > manager > user */
const ROLE_LEVEL: Record<string, number> = {
  user: 0,
  manager: 1,
  admin: 2,
  owner: 3,
};

/** Check if a user's role meets the minimum required level */
export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[requiredRole] ?? 0);
}

/** Check if user is the owner */
export function isOwner(user: { role: string }): boolean {
  return user.role === "owner";
}

/** Require owner role — returns 403 response if not owner */
export function requireOwner(user: { role: string }) {
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Require admin role — returns 403 response if not admin+ */
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
