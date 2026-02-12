import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  return NextResponse.json({
    plan: user.plan,
    role: user.role,
    email: user.email,
    name: user.name,
    planExpiresAt: user.planExpiresAt,
    stripeCustomerId: !!user.stripeCustomerId,
    stripeSubscriptionId: !!user.stripeSubscriptionId,
  });
}
