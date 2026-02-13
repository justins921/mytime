import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProductDemo } from "@/components/product-demo";
import { StickyCTA } from "@/components/sticky-cta";
import { ScheduleCalculator } from "@/components/schedule-calculator";
import { MobileNav } from "@/components/mobile-nav";
import {
  Calendar,
  Clock,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  Timer,
  CalendarClock,
  CheckCircle2,
  Check,
  Star,
  MessageSquare,
  Mail,
  BookOpen,
  Inbox,
  ChevronDown,
  Lock,
  StickyNote,
  Contact,
  HelpCircle,
  Layers,
} from "lucide-react";

/* ─── Helper components ─── */

function MockBlock({ color, border, title, time, tag, past }: {
  color: string; border: string; title: string; time: string; tag?: string; past?: boolean;
}) {
  return (
    <div className="p-2 rounded text-xs" style={{ backgroundColor: color, borderLeft: `3px solid ${border}`, opacity: past ? 0.5 : 1 }}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        {tag && <span className="text-[10px] opacity-60">{tag}</span>}
      </div>
      <div className="text-[10px] opacity-75 mt-0.5">{time}</div>
    </div>
  );
}

function ScheduleMockup() {
  return (
    <div className="rounded-xl border bg-white shadow-lg overflow-hidden max-w-md mx-auto">
      <div className="px-4 py-3 border-b bg-gray-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold">Thursday, Feb 12</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          Today
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        <MockBlock color="#dbeafe" border="#3b82f6" title="Acme Corp" time="8:00 - 10:00" tag="Deep Work" past />
        <MockBlock color="#d1fae5" border="#10b981" title="Natalie Design" time="10:00 - 10:45" tag="Support" past />
        <div className="relative">
          <div
            className="p-2 rounded text-xs relative overflow-visible"
            style={{
              backgroundColor: "#dbeafe",
              borderLeft: "3px solid #3b82f6",
              boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.3), 0 0 8px rgba(239, 68, 68, 0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Natalie Design</span>
              <span className="text-[10px] opacity-60">Deep Work</span>
            </div>
            <div className="text-[10px] opacity-75 mt-0.5">10:45am - 12:45pm</div>
            <div
              className="absolute left-0 right-0 h-[2px] bg-red-500 z-10"
              style={{ top: "45%" }}
            >
              <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="absolute -top-2.5 right-0 text-[10px] font-mono text-red-500">
                11:40am
              </span>
            </div>
          </div>
        </div>
        <MockBlock color="#fce7f3" border="#ec4899" title="Lunch" time="12:45 - 1:30" />
        <MockBlock color="#fef3c7" border="#f59e0b" title="Admin / Email" time="1:30 - 2:00" />
        <MockBlock color="#ede9fe" border="#8b5cf6" title="BrightPath" time="2:00 - 4:00" tag="Deep Work" />
        <MockBlock color="#d1fae5" border="#10b981" title="Acme Corp" time="4:00 - 4:45" tag="Support" />
        <MockBlock color="#f3f4f6" border="#9ca3af" title="Break" time="4:45 - 5:00" />
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, pro }: {
  icon: React.ComponentType<{ className?: string }>; title: string; description: string; pro?: boolean;
}) {
  return (
    <div className="p-6 rounded-xl border bg-white hover:shadow-md transition-shadow relative">
      {pro && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-900 text-white">
          Pro
        </span>
      )}
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role, metric }: {
  quote: string; name: string; role: string; metric: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-white">
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">&ldquo;{quote}&rdquo;</p>
      <p className="text-xs font-semibold text-blue-600 mb-3">{metric}</p>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
  );
}

function IntegrationCard({ icon: Icon, name, description, color, pro }: {
  icon: React.ComponentType<{ className?: string }>; name: string; description: string; color: string; pro?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl border bg-white hover:shadow-md transition-shadow text-center relative">
      {pro && (
        <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-900 text-white">
          Pro
        </span>
      )}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${color}15` }}>
        <div style={{ color }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h4 className="text-sm font-semibold mb-1">{name}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function CompetitorRow({ name, has }: { name: string; has: boolean[] }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 px-3 text-sm font-medium">{name}</td>
      {has.map((v, i) => (
        <td key={i} className="py-2.5 px-2 text-center">
          {v ? (
            <Check className="h-4 w-4 text-green-500 mx-auto" />
          ) : (
            <span className="text-gray-300">&mdash;</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium text-gray-900 hover:text-gray-700">
        {q}
        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
    </details>
  );
}

/* ─── Page ─── */

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-bold text-lg">MyTime</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#compare" className="hover:text-gray-900 transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Sign in
                </Link>
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Start Free
                </a>
              </>
            )}
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          HERO — Category creation: "Workday OS"
          Outcome headline, not feature headline
          Psychology: Anchoring, Present Bias, Loss Aversion
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-6">
              <Zap className="h-3 w-3" />
              The Workday OS for freelancers
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              Run your entire freelance business
              <br />
              <span className="text-gray-400">from one screen.</span>
            </h1>
            <p className="text-sm font-medium text-gray-500 mb-4">Built for freelancers, by a freelancer.</p>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Schedule, time track, manage clients, close leads, triage your inbox,
              and run reports — all from one screen. Your existing tools stay.
              MyTime pulls them together so you can stop tab-switching
              and start working.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                Start Free — No Credit Card
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 border font-medium px-6 py-3 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-4 mt-5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 14-day free trial</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Focused on the workday</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Cancel anytime</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl blur-xl opacity-60" />
            <div className="relative">
              <ScheduleMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          METRICS BAR
          Psychology: Bandwagon Effect, Authority through specifics
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-y bg-gray-50/50 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">8 sec</p>
              <p className="text-xs text-gray-500 mt-1">Schedule generation</p>
            </div>
            <div>
              <p className="text-2xl font-bold">9</p>
              <p className="text-xs text-gray-500 mt-1">Tools in one screen</p>
            </div>
            <div>
              <p className="text-2xl font-bold">6</p>
              <p className="text-xs text-gray-500 mt-1">Integrations built in</p>
            </div>
            <div>
              <p className="text-2xl font-bold">100+</p>
              <p className="text-xs text-gray-500 mt-1">Hours saved per year</p>
            </div>
            <div>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-xs text-gray-500 mt-1">Over-servicing with cap alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PROBLEM / PAIN POINTS
          Psychology: Loss Aversion, Framing Effect
          Corey Haines: Lead with the problem the customer already feels
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Freelancing shouldn&apos;t require 7 subscriptions.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Right now you&apos;re stitching together a calendar, a timer, a CRM,
              a project manager, a notes app, and a Slack tab — just to do the work
              you actually get paid for.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-white border">
              <p className="text-3xl font-bold text-gray-900 mb-2">2+ hrs</p>
              <p className="text-sm font-medium mb-1">Lost every week to planning</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                That&apos;s 100+ hours a year you could be billing.
                At $150/hr, that&apos;s $15,000 in lost revenue — rebuilding
                the same schedule every Sunday night.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white border">
              <p className="text-3xl font-bold text-red-500 mb-2">$3,000+</p>
              <p className="text-sm font-medium mb-1">Unbilled over-servicing per month</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Without real-time cap tracking, you don&apos;t know you&apos;ve
                blown past a client&apos;s hours until the invoice.
                That&apos;s work you&apos;ll never get paid for.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white border">
              <p className="text-3xl font-bold text-gray-900 mb-2">$80+/mo</p>
              <p className="text-sm font-medium mb-1">Spent on tools that don&apos;t talk to each other</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                A CRM here, a timer there, a project board somewhere else.
                None of them know about your schedule, your clients, or
                your monthly caps. You&apos;re the integration layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BEFORE / AFTER
          Psychology: Contrast Effect, Framing
          Corey Haines: Show the transformation, not just features
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">One app. Whole business. Zero tab-switching.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-red-200 bg-red-50/50">
              <p className="text-sm font-semibold text-red-700 mb-4">Without MyTime</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Rebuild your schedule from scratch every week</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Guess how many hours you&apos;ve given each client</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Track leads in a spreadsheet you never update</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Bounce between Slack, Gmail, Notion, calendar, timer</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Alt-tab between Toggl, Notion, HubSpot, and Sunsama all day</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> End the week busy but behind, unsure where the time went</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-green-200 bg-green-50/50">
              <p className="text-sm font-semibold text-green-700 mb-4">With MyTime</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Generate your entire week in under 10 seconds</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Live progress bars track hours against monthly caps</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Built-in CRM moves leads from first touch to client</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Slack, Gmail, Notion, and tasks in one dashboard</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Your existing tools, surfaced in one dashboard</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Know exactly where every hour went with one glance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES — Full product coverage
          Corey Haines: Benefit-first headlines, outcome-oriented
          ═══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Everything a freelancer needs. Nothing they don&apos;t.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built by a freelancer who got tired of switching between 5 tabs.
              Every feature exists because I needed it myself.
              Focused on the workday, not invoicing — you already have a tool for that.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Get your whole week in seconds"
              description="Add your clients, availability, and hour targets. Hit one button. Your entire week appears — balanced across every client by priority weight and weekly targets."
            />
            <FeatureCard
              icon={Timer}
              title="Track time without leaving your flow"
              description="One-click timer tied to your current client and project. Warns you if you context-switch. Entries appear automatically with copy-to-clipboard for your invoice tool."
            />
            <FeatureCard
              icon={Users}
              title="Clients and projects, organized"
              description="Every client has their own profile with retainer, hourly rate, weekly targets, monthly caps, projects, tasks, and notes. Color-coded and sortable by priority."
            />
            <FeatureCard
              icon={Contact}
              title="Close leads with a built-in CRM"
              description="Pipeline board tracks leads from first touch to won deal. Log emails, calls, and meetings. Generate contracts from templates with auto-filled client details. When they sign, convert them to a client in one click."
            />
            <FeatureCard
              icon={CalendarClock}
              title="Tasks that find their own slot"
              description="Add one-off tasks with time estimates, priorities, and due dates. The generator finds the best open slot and weaves them into your week automatically."
            />
            <FeatureCard
              icon={BarChart3}
              title="Never over-service a client again"
              description="Visual progress bars track each client's hours against their monthly cap. They turn yellow at 70%, red at 90% — so you catch it before the invoice."
              pro
            />
            <FeatureCard
              icon={Inbox}
              title="Triage inbox for every tool"
              description="Tasks from ClickUp, Trello, Asana, and Monday.com all land in one triage inbox. Accept, schedule, or dismiss — without switching tabs."
              pro
            />
            <FeatureCard
              icon={StickyNote}
              title="Notes tied to every client"
              description="Quick notes attached to clients, searchable and pinnable. No more hunting through Notion or Apple Notes for that one thing you wrote down."
            />
            <FeatureCard
              icon={Lock}
              title="Deep work stays deep"
              description="Protected focus blocks, support windows, admin time, and breaks. Lock what works, regenerate the rest. Context-switching doesn't eat your productive hours."
            />
            <FeatureCard
              icon={Layers}
              title="Slack, Gmail, Notion — one place"
              description="All your Slack workspaces, Gmail accounts, Outlook, and Notion pages in one sidebar. Read, respond, and triage without leaving your schedule."
              pro
            />
            <FeatureCard
              icon={Calendar}
              title="Calendar feeds built right in"
              description="Pull in Google Calendar, Apple Calendar, or Outlook via iCal feeds. Events appear alongside your blocks so nothing double-books."
              pro
            />
            <FeatureCard
              icon={HelpCircle}
              title="Knowledge base and support"
              description="A self-service knowledge base so you can find answers fast. And when you can't, submit a ticket and we'll get back to you personally."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — Interactive demo
          Psychology: Activation Energy, IKEA Effect
          ═══════════════════════════════════════════════════════════ */}
      <section id="how" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">See the whole product in action.</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Schedule, timer, integrations, CRM, and reports — all working
              together. Click any tab or let the demo run.
            </p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          INTEGRATIONS
          Psychology: Switching Costs, Status-Quo Bias
          ═══════════════════════════════════════════════════════════ */}
      <section id="integrations" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Stop tab-switching your workday.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Your messages, email, docs, calendar, and project tasks —
              all surfaced inside MyTime. Work from one screen.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <IntegrationCard icon={MessageSquare} name="Slack" description="All workspaces, one inbox" color="#E01E5A" />
            <IntegrationCard icon={Mail} name="Gmail & Outlook" description="Triage with kanban boards" color="#EA4335" />
            <IntegrationCard icon={BookOpen} name="Notion" description="Browse and search pages" color="#000000" />
            <IntegrationCard icon={Calendar} name="Calendar" description="iCal, Google, Outlook" color="#4285F4" />
            <IntegrationCard icon={Inbox} name="ClickUp & Trello" description="Triage tasks in one inbox" color="#7B68EE" />
            <IntegrationCard icon={CheckCircle2} name="Asana & Monday" description="Pull tasks for scheduling" color="#F06A6A" />
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Integrations are included on the Pro plan and above — no extra fees from MyTime.
            Each service may require its own account or subscription.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          COMPARISON TABLE — Competitive positioning
          Corey Haines: Own the category, show the gap
          Psychology: Distinctiveness, Anchoring
          ═══════════════════════════════════════════════════════════ */}
      <section id="compare" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Other tools live in their own tab. MyTime pulls them together.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Freelancer tools either focus on invoicing (Bonsai, Plutio, Moxie)
              or daily planning (Sunsama, Motion). MyTime brings your schedule,
              clients, and integrations into one screen — so your workday
              actually flows.
            </p>
          </div>
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-3 font-medium w-36"></th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Schedule</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Timer</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Clients</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">CRM</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Tasks</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Notes</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Integrations</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Triage</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">Reports</th>
                    <th className="px-2 py-3 font-medium text-center text-xs">No Invoice<br/>Bloat</th>
                  </tr>
                </thead>
                <tbody>
                  {/* MyTime row highlighted */}
                  <tr className="border-b bg-blue-50/50 font-semibold">
                    <td className="py-2.5 px-3 text-sm">MyTime</td>
                    {[true, true, true, true, true, true, true, true, true, true].map((v, i) => (
                      <td key={i} className="py-2.5 px-2 text-center">
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      </td>
                    ))}
                  </tr>
                  {/*                           Sched Timer Client CRM  Tasks Notes Integ Triage Rpts NoInv */}
                  <CompetitorRow name="Bonsai"   has={[false, true,  true,  true,  true,  false, false, false, true,  false]} />
                  <CompetitorRow name="Plutio"   has={[false, true,  true,  true,  true,  false, false, false, true,  false]} />
                  <CompetitorRow name="Moxie"    has={[true,  true,  true,  true,  true,  false, false, false, true,  false]} />
                  <CompetitorRow name="Sunsama"  has={[true,  true,  false, false, false, false, true,  true,  true,  true ]} />
                  <CompetitorRow name="Toggl"    has={[false, true,  false, false, true,  false, false, false, true,  true ]} />
                  <CompetitorRow name="Motion"   has={[true,  false, false, false, true,  true,  false, false, true,  true ]} />
                  <CompetitorRow name="Notion"   has={[false, false, false, false, false, true,  false, false, false, true ]} />
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            Comparison based on out-of-the-box features. Some tools offer partial functionality via add-ons or manual setup.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SOCIAL PROOF
          Psychology: Bandwagon Effect, Authority Bias
          Corey Haines: Specific metrics > vague praise
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Freelancers are getting their Sundays back.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <TestimonialCard
              quote="I used to spend an hour every Sunday night in Notion. Now I hit generate and my entire week is done in 8 seconds. I actually look forward to Monday."
              name="Sarah K."
              role="Freelance Brand Strategist, 4 clients"
              metric="Saved 52+ hours/year on planning"
            />
            <TestimonialCard
              quote="I was over-servicing my biggest client by 15 hours a month and had zero idea. The cap tracking paid for itself the first week. The CRM is a bonus I didn't expect."
              name="Marcus T."
              role="Independent Software Consultant, 6 clients"
              metric="Recovered $2,250/mo in unbilled work"
            />
            <TestimonialCard
              quote="Having Slack, email, and my schedule in one place means I don't lose 20 minutes every time I check a message. I finally have one screen for my entire workday."
              name="Priya R."
              role="UX Design Consultant, 5 clients"
              metric="Cut tab-switching by 80%"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PRICING — Good-Better-Best
          Corey Haines: Anchor to value, not cost
          Psychology: Anchoring, Decoy Effect, charm pricing
          ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="border-y py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Your whole workday for less than one tool costs.
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Start free. Upgrade when it pays for itself — and it will.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-xl border bg-white">
              <h3 className="font-semibold mb-1">Starter</h3>
              <p className="text-xs text-gray-500 mb-4">Get started, no credit card</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-sm text-gray-400">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Up to 2 clients</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Schedule generation</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Time tracking &amp; timer</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> CRM pipeline</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Notes &amp; tasks</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Knowledge base</li>
              </ul>
              <a
                href="/signup"
                className="block text-center px-4 py-2.5 rounded-md border font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Start Free
              </a>
            </div>
            {/* Pro */}
            <div className="p-6 rounded-xl border-2 border-gray-900 bg-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-900 text-white text-[10px] font-semibold rounded-full">
                Most Popular
              </div>
              <h3 className="font-semibold mb-1">Pro</h3>
              <p className="text-xs text-gray-500 mb-4">For active freelancers</p>
              <div className="mb-1">
                <span className="text-3xl font-bold">$19</span>
                <span className="text-sm text-gray-400">/mo</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-4">
                or $15/mo billed annually (save 20%)
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Unlimited clients</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> All integrations (Slack, Gmail, Notion, Calendar, ClickUp, Trello, Asana, Monday)</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Monthly cap tracking</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Triage inbox</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Reports &amp; CSV export</li>
              </ul>
              <a
                href="/signup"
                className="block text-center px-4 py-2.5 rounded-md bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                Start 14-Day Free Trial
              </a>
            </div>
            {/* Business */}
            <div className="p-6 rounded-xl border bg-white">
              <h3 className="font-semibold mb-1">Business</h3>
              <p className="text-xs text-gray-500 mb-4">For agencies &amp; power users</p>
              <div className="mb-1">
                <span className="text-3xl font-bold">$39</span>
                <span className="text-sm text-gray-400">/mo</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-4">
                or $29/mo billed annually (save 25%)
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Everything in Pro</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Priority support</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Advanced reports &amp; analytics</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> API access</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Custom integrations</li>
              </ul>
              <a
                href="/signup"
                className="block text-center px-4 py-2.5 rounded-md border font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Start 14-Day Free Trial
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FREE TOOL — Schedule Calculator
          Corey Haines: Give value first, earn the right to sell
          ═══════════════════════════════════════════════════════════ */}
      <section id="calculator" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              How does your week actually stack up?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Plug in your clients and see your utilization, revenue, and time
              breakdown — free, no signup required.
            </p>
          </div>
          <ScheduleCalculator />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FAQ
          Psychology: Reduce uncertainty, handle objections
          ═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Questions? Answers.</h2>
          </div>
          <div className="rounded-xl border bg-white divide-y">
            <div className="px-6">
              <FAQItem
                q="Who is MyTime for?"
                a="Freelancers, consultants, and independent contractors who juggle multiple clients. If you spend Sunday nights building next week's schedule, track time in one tool and manage leads in another, MyTime brings all of that into one screen."
              />
              <FAQItem
                q="How is this different from Bonsai, Plutio, or Moxie?"
                a="Those tools are built around invoicing and payments. MyTime is built around your workday — schedule generation, time tracking, CRM, triage inbox, and integrations. We skip invoicing so we can stay focused on the part of your day that actually matters: the work. The result is a faster, more focused tool for the 8 hours you actually work."
              />
              <FAQItem
                q="How is this different from Sunsama or Motion?"
                a="Sunsama and Motion are daily planners. They're great at calendar + tasks, but they don't know about your clients, retainers, monthly caps, or sales pipeline. MyTime combines the daily planning side with business management — so your schedule, time tracking, CRM, and reports all share the same data."
              />
              <FAQItem
                q="What's the CRM like?"
                a="It's a lightweight pipeline built for freelancers — not a full-blown Salesforce. You track leads through stages (Lead → Contacted → Meeting → Proposal → Won), log activities like emails and calls, and see deal values. You can also generate contracts from built-in templates — retainer agreements, project contracts, or SOWs — with client details auto-filled. When a lead converts, they become a client with all the scheduling and time tracking built in."
              />
              <FAQItem
                q="What integrations are available?"
                a="Slack (multiple workspaces), Gmail, Outlook, Notion (browse and search), Google/Apple/Outlook Calendar (via iCal feeds), ClickUp, Trello, Asana, and Monday.com. Integrations are included on the Pro plan — no extra fees from MyTime. Each service requires its own account (some services like Slack, Notion, or ClickUp may require a paid plan on their end). Everything runs natively inside MyTime, so there's no tab switching."
              />
              <FAQItem
                q="Why no invoicing?"
                a="We want to stay focused on the workday itself. Invoicing touches payments, taxes, and compliance — things that dedicated tools like FreshBooks, Wave, and QuickBooks handle well. That said, you can generate contracts (retainer agreements, project contracts, and SOWs) right from the CRM — so the paperwork that happens before an invoice is covered. We'd rather be the best workday tool than a mediocre everything tool."
              />
              <FAQItem
                q="Is there a free plan?"
                a="Yes. The Starter plan is free forever with up to 2 clients, schedule generation, time tracking, CRM, notes, and the knowledge base. No credit card needed. Upgrade to Pro when you need unlimited clients and integrations."
              />
              <FAQItem
                q="Is my data secure?"
                a="Your data is stored on secure, encrypted servers. Integration tokens are encrypted at rest. Only your authenticated account can access your data."
              />
              <FAQItem
                q="Can I cancel anytime?"
                a="Yes, no contracts or commitments. Cancel from your settings in two clicks. Your data stays accessible on the free Starter plan after cancellation."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
          Corey Haines: Stack value before the ask
          ═══════════════════════════════════════════════════════════ */}
      <section id="signup" className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Your schedule, clients, CRM, and time tracker — finally in one place.
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start your 14-day free trial today. No credit card required.
            One screen for the tools you&apos;re already using.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-8 py-3.5 rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 border font-medium px-8 py-3.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Sign In
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> 14-day free trial</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Cancel anytime</span>
          </div>

          {/* Referral Program */}
          <div className="mt-12 p-6 rounded-xl border bg-gray-50 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold">Refer &amp; earn</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Refer a freelancer friend and you both get rewarded. For every
              friend who signs up, you each get an extra free month
              added to your account.
            </p>
            <div className="flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> You get 1 month free</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> They get 1 month free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>MyTime</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
              <a href="#features" className="hover:text-gray-600 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-gray-600 transition-colors">Pricing</a>
              <a href="#compare" className="hover:text-gray-600 transition-colors">Compare</a>
              <a href="#integrations" className="hover:text-gray-600 transition-colors">Integrations</a>
              <a href="#calculator" className="hover:text-gray-600 transition-colors">Calculator</a>
              <a href="#faq" className="hover:text-gray-600 transition-colors">FAQ</a>
              <a href="/signup" className="hover:text-gray-600 transition-colors">Sign Up</a>
              <a href="/login" className="hover:text-gray-600 transition-colors">Sign In</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>&copy; {new Date().getFullYear()} Sobojinski Solutions LLC. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <StickyCTA />
    </div>
  );
}
