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
} from "lucide-react";

// Fake schedule blocks for the hero mockup
function ScheduleMockup() {
  return (
    <div className="rounded-xl border bg-white shadow-lg overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold">Thursday, Feb 12</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          Today
        </span>
      </div>
      {/* Blocks */}
      <div className="p-3 space-y-1.5">
        <MockBlock color="#dbeafe" border="#3b82f6" title="Acme Corp" time="8:00 - 10:00" tag="Deep Work" past />
        <MockBlock color="#d1fae5" border="#10b981" title="Natalie Design" time="10:00 - 10:45" tag="Support" past />
        {/* Active block with time indicator */}
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
            {/* Red time line */}
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

function MockBlock({
  color,
  border,
  title,
  time,
  tag,
  past,
}: {
  color: string;
  border: string;
  title: string;
  time: string;
  tag?: string;
  past?: boolean;
}) {
  return (
    <div
      className="p-2 rounded text-xs"
      style={{
        backgroundColor: color,
        borderLeft: `3px solid ${border}`,
        opacity: past ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        {tag && <span className="text-[10px] opacity-60">{tag}</span>}
      </div>
      <div className="text-[10px] opacity-75 mt-0.5">{time}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
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

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="p-6 rounded-xl border bg-white">
      <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
  );
}

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
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
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
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-6">
              <Zap className="h-3 w-3" />
              AI-powered scheduling for independents
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              Your week,
              <br />
              <span className="text-gray-400">perfectly planned.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Stop spending Sunday nights building spreadsheets. MyTime generates
              your optimal weekly schedule across every client, tracks hours
              against caps, and shows you exactly where you are — right now.
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
                href="#features"
                className="inline-flex items-center justify-center gap-2 border font-medium px-6 py-3 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                See how it works
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Free during early access. No credit card required.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl blur-xl opacity-60" />
            <div className="relative">
              <ScheduleMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Sound familiar?</h2>
            <p className="text-gray-500">The freelancer&apos;s scheduling trap.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-white border">
              <div className="text-2xl mb-3">&#128337;</div>
              <p className="text-sm font-medium mb-1">Hours lost to planning</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                You spend more time building the schedule than working it.
                Every week it&apos;s the same Tetris game with client blocks.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white border">
              <div className="text-2xl mb-3">&#128200;</div>
              <p className="text-sm font-medium mb-1">Over-servicing clients</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                You blew past a client&apos;s monthly cap by 12 hours before you noticed.
                That&apos;s money you&apos;ll never bill for.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white border">
              <div className="text-2xl mb-3">&#128534;</div>
              <p className="text-sm font-medium mb-1">Context-switch chaos</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Jumping between clients without a plan means deep work never
                happens. You end the day busy but unproductive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Built by a freelancer who got tired of the Sunday night schedule scramble.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Zap}
            title="AI Schedule Generation"
            description="Set your clients, availability, and hour targets. Hit generate. Your entire week appears — balanced, optimized, and ready to work."
          />
          <FeatureCard
            icon={Clock}
            title="Live Time Indicator"
            description="A red line tracks exactly where you are in your day. It drifts gently through your current block so you always know what's now and what's next."
          />
          <FeatureCard
            icon={BarChart3}
            title="Monthly Hour Caps"
            description="Track hours against each client's monthly cap in real time. Visual progress bars turn yellow, then red, before you over-service."
          />
          <FeatureCard
            icon={Calendar}
            title="Calendar Integration"
            description="Pull in external calendars via iCal feeds. Existing meetings show up alongside your schedule so nothing double-books."
          />
          <FeatureCard
            icon={CalendarClock}
            title="One-Off Task Scheduling"
            description="Drop in ad-hoc tasks with time estimates and due dates. The generator finds the best slot and weaves them into your week."
          />
          <FeatureCard
            icon={Users}
            title="Multi-Client Workday"
            description="Deep work blocks, support windows, admin time, breaks — all balanced across clients by priority weight and weekly targets."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Three steps. Zero spreadsheets.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            <StepCard
              number={1}
              title="Configure"
              description="Add your clients, set weekly hour targets and monthly caps, define your availability windows."
            />
            <StepCard
              number={2}
              title="Generate"
              description="Hit one button. MyTime builds your optimal week — deep work, support slots, breaks, and tasks all balanced."
            />
            <StepCard
              number={3}
              title="Work & Track"
              description="Follow the live timeline. Lock blocks you like. Regenerate what you don't. Hours tracked automatically."
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">
            Freelancers are taking their weeks back.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <TestimonialCard
            quote="I used to spend an hour every Sunday building my schedule in Notion. Now I hit generate and it's done in seconds. The live timeline is addictive."
            name="Sarah K."
            role="Freelance Brand Strategist"
          />
          <TestimonialCard
            quote="The monthly cap tracking alone saved me thousands. I was over-servicing my biggest client by 15 hours a month and had no idea."
            name="Marcus T."
            role="Independent Software Consultant"
          />
          <TestimonialCard
            quote="I juggle 6 clients and MyTime is the only tool that actually understands what my week should look like. Deep work blocks are sacred again."
            name="Priya R."
            role="UX Design Consultant"
          />
        </div>
      </section>

      {/* Extra features strip */}
      <section className="border-y bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <Shield className="h-5 w-5 mx-auto mb-2 text-gray-500" />
              <p className="text-xs font-medium">Lock & protect blocks</p>
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

      {/* CTA / Waitlist */}
      <section id="waitlist" className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop planning. Start doing.
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Join the early access list and be first in line when MyTime opens up.
            Free during the beta — no strings attached.
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
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 h-11 rounded-md hover:bg-gray-800 transition-colors text-sm shrink-0"
            >
              Get Early Access
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">
            No spam. Unsubscribe anytime. We&apos;ll only email you when it&apos;s ready.
          </p>
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
