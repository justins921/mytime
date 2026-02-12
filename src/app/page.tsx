import Link from "next/link";
import { auth } from "@/lib/auth";
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
  Star,
} from "lucide-react";

// --- Hero schedule mockup (shows real product UI) ---

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
        {/* Active block — red glow + time indicator */}
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
        <MockBlock color="#dbeafe" border="#3b82f6" title="BrightPath" time="2:00 - 4:00" tag="Deep Work" />
        <MockBlock color="#d1fae5" border="#10b981" title="Acme Corp" time="4:00 - 4:45" tag="Support" />
        <MockBlock color="#f3f4f6" border="#9ca3af" title="Break" time="4:45 - 5:00" />
      </div>
    </div>
  );
}

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

// --- Reusable section components ---

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

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center mx-auto mb-4 text-sm font-bold">
        {number}
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

// --- Page ---

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-bold text-lg">MyTime</span>
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
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Sign in
                </Link>
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Plan My Free Week
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ──────────────────────────────────────────────────────────
          HERO — Copywriting: "{outcome} without {pain}" headline
          Psychology: Anchoring (specific numbers), Present Bias
          (immediate benefit), Social Proof (counter)
          ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-6">
              <Zap className="h-3 w-3" />
              Now in early access
            </div>
            {/* Copywriting: Headline formula — outcome without pain */}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              Your perfect week
              <br />
              <span className="text-gray-400">in one click.</span>
            </h1>
            {/* Copywriting: Specificity > vagueness. Anchoring with "2 hours" */}
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Freelancers waste 2+ hours every week building schedules by hand.
              MyTime generates your optimal week across every client in seconds,
              tracks hours against monthly caps, and shows you exactly where you
              are right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Copywriting: Strong CTA = [Action] + [What they get] */}
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                Plan My Free Week
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 border font-medium px-6 py-3 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                See how it works
              </a>
            </div>
            {/* Psychology: Zero-price effect + risk reversal */}
            <div className="flex items-center gap-4 mt-5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Free forever during beta</span>
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

      {/* ──────────────────────────────────────────────────────────
          PAIN POINTS — Copywriting: Rhetorical question opener
          Psychology: Loss Aversion (dollar amounts), Framing
          Effect (cost of NOT acting), Anchoring (specific numbers)
          ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            {/* Copywriting: Rhetorical question engages reader */}
            <h2 className="text-2xl font-bold mb-3">How much is your schedule costing you?</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Most freelancers don&apos;t realize the true cost of manual scheduling
              until they add it up.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Psychology: Anchoring — lead with specific numbers */}
            <div className="p-6 rounded-xl bg-white border">
              <p className="text-3xl font-bold text-gray-900 mb-2">2+ hrs</p>
              <p className="text-sm font-medium mb-1">Lost every week to planning</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                That&apos;s 100+ hours a year you could be billing.
                At $150/hr, that&apos;s $15,000 in lost revenue — rebuilding
                the same schedule every Sunday night.
              </p>
            </div>
            {/* Psychology: Loss Aversion — frame as money lost */}
            <div className="p-6 rounded-xl bg-white border">
              <p className="text-3xl font-bold text-red-500 mb-2">$3,000+</p>
              <p className="text-sm font-medium mb-1">Unbilled over-servicing per month</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Without real-time cap tracking, you don&apos;t know you&apos;ve
                blown past a client&apos;s hours until the invoice.
                That&apos;s work you&apos;ll never get paid for.
              </p>
            </div>
            {/* Psychology: Contrast Effect — busy ≠ productive */}
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

      {/* ──────────────────────────────────────────────────────────
          BEFORE / AFTER — Psychology: Contrast Effect, Framing
          Copywriting: Show the outcome, not the feature
          ────────────────────────────────────────────────────────── */}
      <section className="py-20 max-w-6xl mx-auto px-6">
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
              <li className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> Know exactly where you are with one glance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          FEATURES — Copywriting: Benefit-first headlines
          (what it means for you, not what it does)
          ────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Everything you need to own your week.
            </h2>
            {/* Copywriting: Liking/Similarity — "one of us" positioning */}
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
              description="A live red line drifts gently through your current block in real time. Glance at your schedule and know instantly where you are in the day."
            />
            <FeatureCard
              icon={BarChart3}
              title="Never over-service a client again"
              description="Visual progress bars track each client's hours against their monthly cap. They turn yellow at 70%, red at 90% — so you catch it before the invoice."
            />
            <FeatureCard
              icon={Calendar}
              title="Your calendar, built in"
              description="Pull in existing calendars via iCal feeds. Meetings, events, and external commitments appear alongside your blocks so nothing double-books."
            />
            <FeatureCard
              icon={CalendarClock}
              title="Drop in tasks, we'll find the slot"
              description="Add one-off tasks with time estimates and due dates. The generator finds the best open slot and weaves them into your week automatically."
            />
            <FeatureCard
              icon={Users}
              title="Deep work stays deep"
              description="Protected focus blocks, support windows, admin time, and breaks — structured so context-switching doesn't eat your most productive hours."
            />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          HOW IT WORKS — Copywriting: Reduce perceived complexity
          Psychology: Activation Energy (make first step easy)
          ────────────────────────────────────────────────────────── */}
      <section id="how" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Three steps. Zero spreadsheets.</h2>
            <p className="text-gray-500">Set up once, generate every week.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            <StepCard
              number={1}
              title="Add your clients"
              description="Name, weekly hour target, monthly cap, priority weight. Takes about 5 minutes for your whole roster."
            />
            <StepCard
              number={2}
              title="Hit generate"
              description="One button. MyTime builds your optimal week — deep work, support, breaks, and tasks balanced across every client."
            />
            <StepCard
              number={3}
              title="Work the plan"
              description="Follow the live timeline. Lock blocks you like. Regenerate what you don't. Hours track automatically as you go."
            />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SOCIAL PROOF — Psychology: Bandwagon Effect, Authority
          Bias, Availability Heuristic (specific results)
          Copywriting: Specific metrics > vague praise
          ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Freelancers are getting their Sundays back.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Copywriting: Specificity — concrete metrics in testimonials */}
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
              quote="I juggle 6 clients and MyTime is the only tool that actually understands what my week needs to look like. Deep work blocks are sacred again."
              name="Priya R."
              role="UX Design Consultant, 5 clients"
              metric="3.5 hrs/day of protected deep work"
            />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          HUB VALUE PROP — Psychology: Switching Costs (once
          everything is here, they won't leave), Status-Quo Bias
          (reduce friction of switching between tools)
          Copywriting: Benefit-first, specific tools named
          ────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-xl font-bold mb-4">
            Stop tab-switching your workday.
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
            Your schedule, time tracking, client hours, calendar events,
            email triage, Notion notes, and Slack messages — all in one place.
            MyTime connects the tools you already use so you can stop bouncing
            between apps and actually get to work.
          </p>
        </div>
      </section>

      {/* Extra features strip */}
      <section className="border-y bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <Shield className="h-5 w-5 mx-auto mb-2 text-gray-500" />
              <p className="text-xs font-medium">Lock blocks you love</p>
            </div>
            <div>
              <Timer className="h-5 w-5 mx-auto mb-2 text-gray-500" />
              <p className="text-xs font-medium">Built-in time tracking</p>
            </div>
            <div>
              <Calendar className="h-5 w-5 mx-auto mb-2 text-gray-500" />
              <p className="text-xs font-medium">Time-off management</p>
            </div>
            <div>
              <Users className="h-5 w-5 mx-auto mb-2 text-gray-500" />
              <p className="text-xs font-medium">Work / Personal modes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          CTA / WAITLIST — Launch Strategy: Phase 4 early access,
          ORB framework (email = owned channel)
          Psychology: Scarcity (founding members), Commitment &
          Consistency (small ask → bigger commitment), Reciprocity
          (free beta), Zero-Price Effect
          Marketing Ideas: Waitlist referral, early access pricing
          Copywriting: Risk reversal, strong CTA formula
          ────────────────────────────────────────────────────────── */}
      <section id="waitlist" className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {/* Psychology: Loss Aversion in headline */}
          <h2 className="text-3xl font-bold mb-4">
            Every week without a plan is money left on the table.
          </h2>
          <p className="text-gray-500 mb-2 max-w-md mx-auto">
            Join as a founding member and get MyTime free — forever.
            No catch. We&apos;re building this in public and want early
            feedback from real freelancers.
          </p>
          {/* Launch Strategy: Scarcity — limited founding spots */}
          <p className="text-sm font-medium text-blue-600 mb-8">
            Limited to the first 500 founding members.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            action="#waitlist"
          >
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 h-11 px-4 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {/* Copywriting: CTA = [Action] + [What they get] */}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 h-11 rounded-md hover:bg-gray-800 transition-colors text-sm shrink-0"
            >
              Claim My Free Spot
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          {/* Psychology: Risk reversal — remove all objections */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Free forever for founders</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Unsubscribe anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>MyTime</span>
          </div>
          <p className="text-xs text-gray-400">
            Built for freelancers, by a freelancer.
          </p>
        </div>
      </footer>
    </div>
  );
}
