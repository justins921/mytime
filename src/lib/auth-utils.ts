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
  free: { clients: 2, integrations: false, reports: false, export: false, notes: false },
  starter: { clients: 2, integrations: false, reports: false, export: false, notes: false },
  pro: { clients: Infinity, integrations: true, reports: true, export: true, notes: true },
  business: { clients: Infinity, integrations: true, reports: true, export: true, notes: true },
} as const;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
}
