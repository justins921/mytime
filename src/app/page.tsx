import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProductDemo } from "@/components/product-demo";
import { WaitlistForm } from "@/components/waitlist-form";
import { StickyCTA } from "@/components/sticky-cta";
import { ScheduleCalculator } from "@/components/schedule-calculator";
import { MobileNav } from "@/components/mobile-nav";
import {
  Calendar,
  Clock,
  Users,
  BarChart3,
  Zap,
  Shield,
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

function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>; title: string; description: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-white hover:shadow-md transition-shadow">
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

function IntegrationCard({ icon: Icon, name, description, color }: {
  icon: React.ComponentType<{ className?: string }>; name: string; description: string; color: string;
}) {
  return (
    <div className="p-5 rounded-xl border bg-white hover:shadow-md transition-shadow text-center">
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
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#integrations" className="hover:text-gray-900 transition-colors">Integrations</a>
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
                  href="#waitlist"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Get Early Access
                </a>
              </>
            )}
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          HERO
          Copywriting: "{outcome} without {pain}" headline
          Psychology: Anchoring (specific numbers), Present Bias
          ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-6">
              <Zap className="h-3 w-3" />
              Now in early access
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              Your perfect week
              <br />
              <span className="text-gray-400">in one click.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Freelancers waste 2+ hours every week building schedules by hand.
              MyTime generates your optimal week across every client in seconds,
              tracks time against monthly caps, and puts Slack, Gmail, and Notion
              in one place so you stop tab-switching and start working.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                Get Early Access
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
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> No credit card</span>
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
          METRICS BAR — Social proof numbers
          Psychology: Bandwagon Effect, Authority through specifics
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-y bg-gray-50/50 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">8 sec</p>
              <p className="text-xs text-gray-500 mt-1">Average generation time</p>
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
          PAIN POINTS
          Copywriting: Rhetorical question opener
          Psychology: Loss Aversion (dollar amounts), Framing Effect
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">How much is your schedule costing you?</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Most freelancers don&apos;t realize the true cost of manual scheduling
              until they add it up.
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
              <p className="text-3xl font-bold text-gray-900 mb-2">0 hrs</p>
              <p className="text-sm font-medium mb-1">Of deep work actually happening</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Without a plan, you context-switch between clients all day.
                You end every week busy but behind — and your best work
                never gets done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BEFORE / AFTER
          Psychology: Contrast Effect, Framing
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Sunday night: solved.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-red-200 bg-red-50/50">
              <p className="text-sm font-semibold text-red-700 mb-4">Without MyTime</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Rebuild your schedule from scratch every week</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Guess how many hours you&apos;ve given each client</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Over-service some clients, under-service others</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Context-switch all day with no deep work blocks</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> Bounce between Slack, Gmail, Notion, calendar, timer</li>
                <li className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> End the week unsure if you hit your targets</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-green-200 bg-green-50/50">
              <p className="text-sm font-semibold text-green-700 mb-4">With MyTime</p>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Generate your entire week in under 10 seconds</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Live progress bars show hours used vs. monthly cap</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Every client gets exactly the hours they&apos;re paying for</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Protected deep work blocks for your best thinking</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Slack, Gmail, Notion, and calendar in one dashboard</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Know exactly where you are with one glance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES
          Copywriting: Benefit-first headlines
          ═══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Everything you need to own your week.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built by a freelancer who got tired of the Sunday night spreadsheet.
              Every feature exists because I needed it myself.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Get your whole week in seconds"
              description="Add your clients, availability, and hour targets. Hit one button. Your entire week appears — balanced across every client by priority weight and weekly targets."
            />
            <FeatureCard
              icon={Clock}
              title="Always know what's now and what's next"
              description="A live red line drifts through your current block in real time. Past blocks fade, the active block glows. Glance at your schedule and know instantly where you are."
            />
            <FeatureCard
              icon={BarChart3}
              title="Never over-service a client again"
              description="Visual progress bars track each client's hours against their monthly cap. They turn yellow at 70%, red at 90% — so you catch it before the invoice."
            />
            <FeatureCard
              icon={Timer}
              title="Track time without leaving your flow"
              description="Start a timer tied to your current client and project. It warns you if you context-switch. Today's entries appear automatically with copy-to-clipboard for invoicing."
            />
            <FeatureCard
              icon={CalendarClock}
              title="Drop in tasks, we'll find the slot"
              description="Add one-off tasks with time estimates, priorities, and due dates. The generator finds the best open slot and weaves them into your week automatically."
            />
            <FeatureCard
              icon={Lock}
              title="Lock what works, regenerate the rest"
              description="Love a block? Lock it. Next time you generate, locked and manual blocks stay put while everything else reshuffles around them."
            />
            <FeatureCard
              icon={Calendar}
              title="Your calendar, built right in"
              description="Pull in Google Calendar, Apple Calendar, or Outlook via iCal feeds. Events appear alongside your blocks so nothing double-books."
            />
            <FeatureCard
              icon={StickyNote}
              title="Notes tied to every client"
              description="Quick notes attached to clients, searchable and pinnable. No more hunting through Notion or Apple Notes for that one thing you wrote down."
            />
            <FeatureCard
              icon={Users}
              title="Deep work stays deep"
              description="Protected focus blocks, support windows, admin time, and breaks — structured so context-switching doesn't eat your most productive hours."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — Interactive multi-feature demo
          Psychology: Activation Energy (looks easy), IKEA Effect
          ═══════════════════════════════════════════════════════════ */}
      <section id="how" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">See the whole product in action.</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Schedule, time tracking, integrations, and reports — all working
              together. Click any tab or let the demo run.
            </p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          INTEGRATIONS
          Psychology: Switching Costs, Status-Quo Bias
          Copywriting: Benefit-first, specific tools named
          ═══════════════════════════════════════════════════════════ */}
      <section id="integrations" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Stop tab-switching your workday.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Your schedule, time tracking, messages, email, notes, and tasks —
              all in one place. MyTime connects the tools you already use.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <IntegrationCard
              icon={MessageSquare}
              name="Slack"
              description="All workspaces, one inbox"
              color="#E01E5A"
            />
            <IntegrationCard
              icon={Mail}
              name="Gmail"
              description="Triage with kanban boards"
              color="#EA4335"
            />
            <IntegrationCard
              icon={BookOpen}
              name="Notion"
              description="Browse and search pages"
              color="#000000"
            />
            <IntegrationCard
              icon={Calendar}
              name="Calendar"
              description="iCal, Google, Outlook"
              color="#4285F4"
            />
            <IntegrationCard
              icon={Inbox}
              name="ClickUp"
              description="Triage tasks from ClickUp"
              color="#7B68EE"
            />
            <IntegrationCard
              icon={CheckCircle2}
              name="More soon"
              description="Suggest an integration"
              color="#9CA3AF"
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            All integrations run inside MyTime — no context switching, no extra tabs.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SOCIAL PROOF
          Psychology: Bandwagon Effect, Authority Bias
          Copywriting: Specific metrics > vague praise
          ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20">
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
              quote="I was over-servicing my biggest client by 15 hours a month and had zero idea. The cap tracking paid for itself the first week."
              name="Marcus T."
              role="Independent Software Consultant, 6 clients"
              metric="Recovered $2,250/mo in unbilled work"
            />
            <TestimonialCard
              quote="Having Slack, email, and my schedule in one place means I don't lose 20 minutes every time I check a message. The focus mode is a game-changer."
              name="Priya R."
              role="UX Design Consultant, 5 clients"
              metric="3.5 hrs/day of protected deep work"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PRICING — pricing-strategy skill
          Good-Better-Best tiers, anchoring, decoy effect
          Psychology: Anchoring (show Pro first), charm pricing
          ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="border-y py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Simple pricing. No surprises.
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Start free. Upgrade when it pays for itself — and it will.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-xl border bg-white">
              <h3 className="font-semibold mb-1">Starter</h3>
              <p className="text-xs text-gray-500 mb-4">For getting started</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-sm text-gray-400">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Up to 2 clients</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Schedule generation</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Time tracking</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Basic reports</li>
              </ul>
              <a
                href="#waitlist"
                className="block text-center px-4 py-2.5 rounded-md border font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Start Free
              </a>
            </div>
            {/* Pro — recommended, anchoring via visual prominence */}
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
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> All integrations (Slack, Gmail, Notion, Calendar, ClickUp)</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Monthly cap tracking</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Task management + kanban</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> Client notes</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> CSV export</li>
              </ul>
              <a
                href="#waitlist"
                className="block text-center px-4 py-2.5 rounded-md bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                Get Early Access
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
                href="#waitlist"
                className="block text-center px-4 py-2.5 rounded-md border font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Get Early Access
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FREE TOOL — free-tool-strategy skill
          Adjacent to core product, ungated, drives signups
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
          FAQ — Objection handling
          Psychology: Reduce uncertainty, build trust
          page-cro: Address price/value, implementation, trust
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
                a="Freelancers, consultants, and independent contractors who juggle multiple clients. If you spend Sunday nights building next week's schedule in a spreadsheet or Notion, MyTime is for you."
              />
              <FAQItem
                q="How does schedule generation work?"
                a="You add your clients with their weekly hour targets, set your availability and breaks, and hit Generate. The engine allocates deep work blocks, support sweeps, admin time, and breaks — balanced by priority weights and daily-touch rules. It takes about 8 seconds."
              />
              <FAQItem
                q="What integrations are available?"
                a="Slack (multiple workspaces), Gmail (multiple accounts), Notion (browse and search), Google/Apple/Outlook Calendar (via iCal feeds), and ClickUp (task triage). All integrations run inside MyTime — no tab switching."
              />
              <FAQItem
                q="Can I keep my existing schedule blocks when regenerating?"
                a="Yes. Lock any block you like, and it survives regeneration. You can also keep manually-created blocks. The generator reshuffles everything else around your locked items."
              />
              <FAQItem
                q="How does monthly cap tracking work?"
                a="Set a monthly hour cap for each client. As you track time, progress bars show usage in real time. They turn yellow at 70% and red at 90%, so you never over-service without knowing."
              />
              <FAQItem
                q="Is there a free plan?"
                a="Yes. The Starter plan is free forever with up to 2 clients, schedule generation, time tracking, and basic reports. No credit card needed. Upgrade to Pro when you need unlimited clients and integrations."
              />
              <FAQItem
                q="Is my data secure?"
                a="Your data is stored on secure, encrypted servers. Auth is handled through magic link email — no passwords stored. Integration tokens are encrypted at rest. Only your authorized email can access your account."
              />
              <FAQItem
                q="What does the free trial include?"
                a="Full access to all Pro features and integrations for 14 days. No credit card required. If you don't upgrade, you keep your data and drop down to the free Starter plan."
              />
              <FAQItem
                q="Can I cancel anytime?"
                a="Yes, no contracts or commitments. Cancel from your settings in two clicks. Your data stays accessible on the Starter plan after cancellation."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA / WAITLIST — Upgraded form with CRO best practices
          form-cro: email only, inline validation, typo detection,
          success state, trust signals near submit
          signup-flow-cro: progressive commitment, value before ask
          referral-program: double-sided reward, queue jumping
          ═══════════════════════════════════════════════════════════ */}
      <section id="waitlist" className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Every week without a plan is money left on the table.
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Join the waitlist for early access. Early members lock in
            launch pricing and get first access as we roll out invites.
          </p>
          <WaitlistForm />

          {/* Referral Program */}
          <div className="mt-12 p-6 rounded-xl border bg-gray-50 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold">Skip the line</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Refer a friend and you both move up the waitlist. For every
              friend who joins, you each get an extra free month added to
              your trial when we launch.
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
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <a href="#features" className="hover:text-gray-600 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-gray-600 transition-colors">Pricing</a>
              <a href="#integrations" className="hover:text-gray-600 transition-colors">Integrations</a>
              <a href="#calculator" className="hover:text-gray-600 transition-colors">Calculator</a>
              <a href="#faq" className="hover:text-gray-600 transition-colors">FAQ</a>
            </div>
            <p className="text-xs text-gray-400">
              Built for freelancers, by a freelancer.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA — page-cro: always-visible conversion path */}
      <StickyCTA />
    </div>
  );
}
