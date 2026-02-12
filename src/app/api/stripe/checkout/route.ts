import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { getStripe, PLAN_TO_PRICE } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { user, res } = await getAuthUser();
  if (!user) return res;

  try {
    const { plan, billing = "monthly" } = await req.json();

    const prices = PLAN_TO_PRICE[plan];
    if (!prices) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = billing === "annual" ? prices.annual : prices.monthly;
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Use request origin so redirects work in both local dev and production
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?payment=success`,
      cancel_url: `${origin}/settings?payment=cancelled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId: user.id },
      },
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
