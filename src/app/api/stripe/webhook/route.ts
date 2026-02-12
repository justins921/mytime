import { NextResponse } from "next/server";
import { getStripe, PRICE_TO_PLAN } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
          const subItem = subscription.items.data[0];
          const priceId = subItem?.price.id;
          const plan = PRICE_TO_PLAN[priceId] || "pro";
          const periodEnd = subItem?.current_period_end;

          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeSubscriptionId: subscription.id,
              plan,
              planExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          const subItem = subscription.items.data[0];
          const priceId = subItem?.price.id;
          const plan = PRICE_TO_PLAN[priceId] || "pro";
          const active = ["active", "trialing"].includes(subscription.status);
          const periodEnd = subItem?.current_period_end;

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: active ? plan : "free",
              stripeSubscriptionId: subscription.id,
              planExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "free",
              stripeSubscriptionId: null,
              planExpiresAt: null,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
          if (user) {
            console.warn(`Payment failed for user ${user.id}, customer ${customerId}`);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
