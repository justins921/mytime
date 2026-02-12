import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
