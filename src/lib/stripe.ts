import Stripe from "stripe";

// Lazy-init to avoid build-time errors when env var is not set
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

/** Map Stripe price IDs to plan names */
export const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY || ""]: "pro",
  [process.env.STRIPE_PRICE_PRO_ANNUAL || ""]: "pro",
  [process.env.STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "business",
  [process.env.STRIPE_PRICE_BUSINESS_ANNUAL || ""]: "business",
};

/** Map plan names to monthly Stripe price IDs (default checkout) */
export const PLAN_TO_PRICE: Record<string, { monthly: string; annual: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || "",
  },
};
