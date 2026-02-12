"use client";

import Script from "next/script";

/* ─── Analytics Tracking ───
   analytics-tracking skill: GA4 + GTM setup with custom events.
   Replace GA_MEASUREMENT_ID with your actual GA4 property ID.
   Replace GTM_ID with your GTM container ID (if using GTM).
─── */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}

/* ─── Custom Event Helpers ───
   Use these throughout the app to track key conversion events.
   analytics-tracking: event naming convention = lowercase_underscore
─── */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

// Pre-defined events for consistency
export const events = {
  ctaClicked: (location: string) =>
    trackEvent("cta_clicked", { button_text: "Get Early Access", location }),
  waitlistJoined: (method: string) =>
    trackEvent("waitlist_joined", { method }),
  calculatorUsed: (clientCount: number) =>
    trackEvent("calculator_used", { client_count: clientCount }),
  demoWatched: (tab: string) =>
    trackEvent("demo_watched", { tab }),
  pricingViewed: (plan: string) =>
    trackEvent("pricing_viewed", { plan }),
  faqOpened: (question: string) =>
    trackEvent("faq_opened", { question }),
  referralClicked: () =>
    trackEvent("referral_clicked"),
};
