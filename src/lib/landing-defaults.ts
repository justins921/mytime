// ─── Landing Page CMS Defaults ─────────────────────
// These are the default values for all editable landing page sections.
// The landing page reads from the database and falls back to these defaults.

export type HeroContent = {
  badge: string;
  headline: string;
  headlineAccent: string;
  subtext: string;
  body: string;
  cta1Label: string;
  cta2Label: string;
  trustSignals: string[];
};

export type MetricItem = { value: string; label: string };
export type MetricsContent = { items: MetricItem[] };

export type ProblemCard = { stat: string; statColor: string; title: string; description: string };
export type ProblemsContent = { heading: string; body: string; cards: ProblemCard[] };

export type BeforeAfterContent = { heading: string; without: string[]; with: string[] };

export type FeatureCardData = { title: string; description: string; pro?: boolean };
export type FeaturesContent = { heading: string; body: string; cards: FeatureCardData[] };

export type HowItWorksContent = { heading: string; body: string };

export type IntegrationCardData = { name: string; description: string };
export type IntegrationsContent = { heading: string; body: string; note: string; cards: IntegrationCardData[] };

export type ComparisonContent = { heading: string; body: string; note: string };

export type PricingTier = {
  name: string;
  badge?: string;
  subtitle: string;
  price: string;
  period: string;
  discount?: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
};
export type PricingContent = { heading: string; body: string; note: string; tiers: PricingTier[] };

export type CalculatorContent = { heading: string; body: string };

export type FAQItem = { q: string; a: string };
export type FAQContent = { heading: string; items: FAQItem[] };

export type FinalCtaContent = {
  heading: string;
  body: string;
  cta1Label: string;
  cta2Label: string;
  trustSignals: string[];
  referralTitle: string;
  referralBody: string;
  referralBenefits: string[];
};

export type LandingSections = {
  hero: HeroContent;
  metrics: MetricsContent;
  problems: ProblemsContent;
  beforeAfter: BeforeAfterContent;
  features: FeaturesContent;
  howItWorks: HowItWorksContent;
  integrations: IntegrationsContent;
  comparison: ComparisonContent;
  pricing: PricingContent;
  calculator: CalculatorContent;
  faq: FAQContent;
  finalCta: FinalCtaContent;
};

export const LANDING_DEFAULTS: LandingSections = {
  hero: {
    badge: "The Workday OS for freelancers",
    headline: "Run your entire freelance business",
    headlineAccent: "from one screen.",
    subtext: "Built for freelancers, by a freelancer.",
    body: "Schedule, time track, manage clients, close leads, triage your inbox, and run reports — all from one screen. Your existing tools stay. MyTime pulls them together so you can stop tab-switching and start working.",
    cta1Label: "Start Free — No Credit Card",
    cta2Label: "See how it works",
    trustSignals: ["14-day free trial", "Focused on the workday", "Cancel anytime"],
  },

  metrics: {
    items: [
      { value: "8 sec", label: "Schedule generation" },
      { value: "9", label: "Tools in one screen" },
      { value: "6", label: "Integrations built in" },
      { value: "100+", label: "Hours saved per year" },
      { value: "$0", label: "Over-servicing with cap alerts" },
    ],
  },

  problems: {
    heading: "Freelancing shouldn't require 7 subscriptions.",
    body: "Right now you're stitching together a calendar, a timer, a CRM, a project manager, a notes app, and a Slack tab — just to do the work you actually get paid for.",
    cards: [
      {
        stat: "2+ hrs",
        statColor: "text-gray-900",
        title: "Lost every week to planning",
        description: "That's 100+ hours a year you could be billing. At $150/hr, that's $15,000 in lost revenue — rebuilding the same schedule every Sunday night.",
      },
      {
        stat: "$3,000+",
        statColor: "text-red-500",
        title: "Unbilled over-servicing per month",
        description: "Without real-time cap tracking, you don't know you've blown past a client's hours until the invoice. That's work you'll never get paid for.",
      },
      {
        stat: "$80+/mo",
        statColor: "text-gray-900",
        title: "Spent on tools that don't talk to each other",
        description: "A CRM here, a timer there, a project board somewhere else. None of them know about your schedule, your clients, or your monthly caps. You're the integration layer.",
      },
    ],
  },

  beforeAfter: {
    heading: "One app. Whole business. Zero tab-switching.",
    without: [
      "Rebuild your schedule from scratch every week",
      "Guess how many hours you've given each client",
      "Track leads in a spreadsheet you never update",
      "Bounce between Slack, Gmail, Notion, calendar, timer",
      "Alt-tab between Toggl, Notion, HubSpot, and Sunsama all day",
      "End the week busy but behind, unsure where the time went",
    ],
    with: [
      "Generate your entire week in under 10 seconds",
      "Live progress bars track hours against monthly caps",
      "Built-in CRM moves leads from first touch to client",
      "Slack, Gmail, Notion, and tasks in one dashboard",
      "Your existing tools, surfaced in one dashboard",
      "Know exactly where every hour went with one glance",
    ],
  },

  features: {
    heading: "Everything a freelancer needs. Nothing they don't.",
    body: "Built by a freelancer who got tired of switching between 5 tabs. Every feature exists because I needed it myself. Focused on the workday, not invoicing — you already have a tool for that.",
    cards: [
      { title: "Get your whole week in seconds", description: "Add your clients, availability, and hour targets. Hit one button. Your entire week appears — balanced across every client by priority weight and weekly targets." },
      { title: "Track time without leaving your flow", description: "One-click timer tied to your current client and project. Warns you if you context-switch. Entries appear automatically with copy-to-clipboard for your invoice tool." },
      { title: "Clients and projects, organized", description: "Every client has their own profile with retainer, hourly rate, weekly targets, monthly caps, projects, tasks, and notes. Color-coded and sortable by priority." },
      { title: "Close leads with a built-in CRM", description: "Pipeline board tracks leads from first touch to won deal. Log emails, calls, and meetings. Generate contracts from templates with auto-filled client details. When they sign, convert them to a client in one click." },
      { title: "Tasks that find their own slot", description: "Add one-off tasks with time estimates, priorities, and due dates. The generator finds the best open slot and weaves them into your week automatically." },
      { title: "Never over-service a client again", description: "Visual progress bars track each client's hours against their monthly cap. They turn yellow at 70%, red at 90% — so you catch it before the invoice.", pro: true },
      { title: "Triage inbox for every tool", description: "Tasks from ClickUp, Trello, Asana, and Monday.com all land in one triage inbox. Accept, schedule, or dismiss — without switching tabs.", pro: true },
      { title: "Notes tied to every client", description: "Quick notes attached to clients, searchable and pinnable. No more hunting through Notion or Apple Notes for that one thing you wrote down." },
      { title: "Deep work stays deep", description: "Protected focus blocks, support windows, admin time, and breaks. Lock what works, regenerate the rest. Context-switching doesn't eat your productive hours." },
      { title: "Slack, Gmail, Notion — one place", description: "All your Slack workspaces, Gmail accounts, Outlook, and Notion pages in one sidebar. Read, respond, and triage without leaving your schedule.", pro: true },
      { title: "Calendar feeds built right in", description: "Pull in Google Calendar, Apple Calendar, or Outlook via iCal feeds. Events appear alongside your blocks so nothing double-books.", pro: true },
      { title: "Knowledge base and support", description: "A self-service knowledge base so you can find answers fast. And when you can't, submit a ticket and we'll get back to you personally." },
    ],
  },

  howItWorks: {
    heading: "See the whole product in action.",
    body: "Schedule, timer, integrations, CRM, and reports — all working together. Click any tab or let the demo run.",
  },

  integrations: {
    heading: "Stop tab-switching your workday.",
    body: "Your messages, email, docs, calendar, and project tasks — all surfaced inside MyTime. Work from one screen.",
    note: "Integrations are included on the Pro plan and above — no extra fees from MyTime. Each service may require its own account or subscription.",
    cards: [
      { name: "Slack", description: "All workspaces, one inbox" },
      { name: "Gmail & Outlook", description: "Triage with kanban boards" },
      { name: "Notion", description: "Browse and search pages" },
      { name: "Calendar", description: "iCal, Google, Outlook" },
      { name: "ClickUp & Trello", description: "Triage tasks in one inbox" },
      { name: "Asana & Monday", description: "Pull tasks for scheduling" },
    ],
  },

  comparison: {
    heading: "Other tools live in their own tab. MyTime pulls them together.",
    body: "Freelancer tools either focus on invoicing (Bonsai, Plutio, Moxie) or daily planning (Sunsama, Motion). MyTime brings your schedule, clients, and integrations into one screen — so your workday actually flows.",
    note: "Comparison based on out-of-the-box features. Some tools offer partial functionality via add-ons or manual setup.",
  },

  pricing: {
    heading: "Your whole workday for less than one tool costs.",
    body: "Start free. Upgrade when it pays for itself — and it will.",
    note: "All plans include a 14-day free trial. No credit card required.",
    tiers: [
      {
        name: "Starter",
        subtitle: "Get started, no credit card",
        price: "$0",
        period: "/mo",
        features: [
          "Up to 2 clients",
          "Schedule generation",
          "Time tracking & timer",
          "CRM pipeline",
          "Notes & tasks",
          "Knowledge base",
        ],
        ctaLabel: "Start Free",
      },
      {
        name: "Pro",
        badge: "Most Popular",
        subtitle: "For active freelancers",
        price: "$19",
        period: "/mo",
        discount: "or $15/mo billed annually (save 20%)",
        features: [
          "Unlimited clients",
          "All integrations (Slack, Gmail, Notion, Calendar, ClickUp, Trello, Asana, Monday)",
          "Monthly cap tracking",
          "Triage inbox",
          "Reports & CSV export",
        ],
        ctaLabel: "Start 14-Day Free Trial",
        highlighted: true,
      },
      {
        name: "Business",
        subtitle: "For agencies & power users",
        price: "$39",
        period: "/mo",
        discount: "or $29/mo billed annually (save 25%)",
        features: [
          "Everything in Pro",
          "Priority support",
          "Advanced reports & analytics",
          "API access",
          "Custom integrations",
        ],
        ctaLabel: "Start 14-Day Free Trial",
      },
    ],
  },

  calculator: {
    heading: "How does your week actually stack up?",
    body: "Plug in your clients and see your utilization, revenue, and time breakdown — free, no signup required.",
  },

  faq: {
    heading: "Questions? Answers.",
    items: [
      {
        q: "Who is MyTime for?",
        a: "Freelancers, consultants, and independent contractors who juggle multiple clients. If you spend Sunday nights building next week's schedule, track time in one tool and manage leads in another, MyTime brings all of that into one screen.",
      },
      {
        q: "How is this different from Bonsai, Plutio, or Moxie?",
        a: "Those tools are built around invoicing and payments. MyTime is built around your workday — schedule generation, time tracking, CRM, triage inbox, and integrations. We skip invoicing so we can stay focused on the part of your day that actually matters: the work. The result is a faster, more focused tool for the 8 hours you actually work.",
      },
      {
        q: "How is this different from Sunsama or Motion?",
        a: "Sunsama and Motion are daily planners. They're great at calendar + tasks, but they don't know about your clients, retainers, monthly caps, or sales pipeline. MyTime combines the daily planning side with business management — so your schedule, time tracking, CRM, and reports all share the same data.",
      },
      {
        q: "What's the CRM like?",
        a: "It's a lightweight pipeline built for freelancers — not a full-blown Salesforce. You track leads through stages (Lead → Contacted → Meeting → Proposal → Won), log activities like emails and calls, and see deal values. You can also generate contracts from built-in templates — retainer agreements, project contracts, or SOWs — with client details auto-filled. When a lead converts, they become a client with all the scheduling and time tracking built in.",
      },
      {
        q: "What integrations are available?",
        a: "Slack (multiple workspaces), Gmail, Outlook, Notion (browse and search), Google/Apple/Outlook Calendar (via iCal feeds), ClickUp, Trello, Asana, and Monday.com. Integrations are included on the Pro plan — no extra fees from MyTime. Each service requires its own account (some services like Slack, Notion, or ClickUp may require a paid plan on their end). Everything runs natively inside MyTime, so there's no tab switching.",
      },
      {
        q: "Why no invoicing?",
        a: "We want to stay focused on the workday itself. Invoicing touches payments, taxes, and compliance — things that dedicated tools like FreshBooks, Wave, and QuickBooks handle well. That said, you can generate contracts (retainer agreements, project contracts, and SOWs) right from the CRM — so the paperwork that happens before an invoice is covered. We'd rather be the best workday tool than a mediocre everything tool.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. The Starter plan is free forever with up to 2 clients, schedule generation, time tracking, CRM, notes, and the knowledge base. No credit card needed. Upgrade to Pro when you need unlimited clients and integrations.",
      },
      {
        q: "Is my data secure?",
        a: "Your data is stored on secure, encrypted servers. Integration tokens are encrypted at rest. Only your authenticated account can access your data.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes, no contracts or commitments. Cancel from your settings in two clicks. Your data stays accessible on the free Starter plan after cancellation.",
      },
    ],
  },

  finalCta: {
    heading: "Your schedule, clients, CRM, and time tracker — finally in one place.",
    body: "Start your 14-day free trial today. No credit card required. One screen for the tools you're already using.",
    cta1Label: "Create Free Account",
    cta2Label: "Sign In",
    trustSignals: ["14-day free trial", "No credit card", "Cancel anytime"],
    referralTitle: "Refer & earn",
    referralBody: "Refer a freelancer friend and you both get rewarded. For every friend who signs up, you each get an extra free month added to your account.",
    referralBenefits: ["You get 1 month free", "They get 1 month free"],
  },
};

// Section labels for admin UI
export const SECTION_LABELS: Record<keyof LandingSections, string> = {
  hero: "Hero",
  metrics: "Metrics Bar",
  problems: "Pain Points",
  beforeAfter: "Before / After",
  features: "Features",
  howItWorks: "How It Works",
  integrations: "Integrations",
  comparison: "Comparison Table",
  pricing: "Pricing",
  calculator: "Calculator",
  faq: "FAQ",
  finalCta: "Final CTA & Referral",
};
