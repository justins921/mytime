import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyTime — The Workday Manager for Freelancers",
  description:
    "Generate your perfect week in one click. MyTime auto-schedules clients, tracks hours against monthly caps, and puts Slack, Gmail, and Notion in one dashboard. Built for freelancers juggling multiple clients.",
  keywords: [
    "freelance schedule",
    "client workday manager",
    "freelance time tracking",
    "weekly schedule generator",
    "freelancer productivity",
    "client hour tracking",
    "multi-client scheduling",
  ],
  openGraph: {
    title: "MyTime — Your Perfect Week in One Click",
    description:
      "Auto-generate weekly schedules across every client. Track hours against monthly caps. Slack, Gmail, Notion — all in one dashboard. Built for freelancers.",
    type: "website",
    siteName: "MyTime",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyTime — The Workday Manager for Freelancers",
    description:
      "Generate your perfect week in one click. Track hours, manage clients, and stop tab-switching. Built for freelancers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* JSON-LD structured data for SEO (schema-markup skill) */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Sobojinski Solutions LLC",
      url: "https://mytime.app",
      description: "The workday manager for freelancers who juggle multiple clients.",
      brand: {
        "@type": "Brand",
        name: "MyTime",
      },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      name: "MyTime",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Automatically generate weekly work schedules, track time against monthly caps, and manage Slack, Gmail, and Notion in one dashboard.",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "0",
        highPrice: "39",
        offerCount: "3",
      },
      featureList: [
        "One-click schedule generation",
        "Monthly hour cap tracking",
        "Built-in time tracker",
        "Slack integration",
        "Gmail integration",
        "Notion integration",
        "Calendar sync (iCal, Google, Outlook)",
        "Task management with kanban boards",
        "Client notes",
        "CSV report export",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Who is MyTime for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Freelancers, consultants, and independent contractors who juggle multiple clients. If you spend Sunday nights building next week's schedule in a spreadsheet or Notion, MyTime is for you.",
          },
        },
        {
          "@type": "Question",
          name: "How does schedule generation work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You add your clients with their weekly hour targets, set your availability and breaks, and hit Generate. The engine allocates deep work blocks, support sweeps, admin time, and breaks — balanced by priority weights and daily-touch rules. It takes about 8 seconds.",
          },
        },
        {
          "@type": "Question",
          name: "What integrations are available?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Slack (multiple workspaces), Gmail (multiple accounts), Notion (browse and search), Google/Apple/Outlook Calendar (via iCal feeds), and ClickUp (task triage). All integrations run inside MyTime — no tab switching.",
          },
        },
        {
          "@type": "Question",
          name: "How does monthly cap tracking work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Set a monthly hour cap for each client. As you track time, progress bars show usage in real time. They turn yellow at 70% and red at 90%, so you never over-service without knowing.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
