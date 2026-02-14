import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProductDemo } from "@/components/product-demo";
import { StickyCTA } from "@/components/sticky-cta";
import { ScheduleCalculator } from "@/components/schedule-calculator";
import { MobileNav } from "@/components/mobile-nav";
import { prisma } from "@/lib/db";
import {
  LANDING_DEFAULTS,
  type LandingSections,
} from "@/lib/landing-defaults";
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

/* ─── Load CMS content ─── */

async function loadLandingContent(): Promise<LandingSections> {
  try {
    const rows = await prisma.landingPageSection.findMany();
    const sections: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        sections[row.section] = JSON.parse(row.content);
      } catch { /* skip */ }
    }
    return {
      hero: (sections.hero as LandingSections["hero"]) ?? LANDING_DEFAULTS.hero,
      metrics: (sections.metrics as LandingSections["metrics"]) ?? LANDING_DEFAULTS.metrics,
      problems: (sections.problems as LandingSections["problems"]) ?? LANDING_DEFAULTS.problems,
      beforeAfter: (sections.beforeAfter as LandingSections["beforeAfter"]) ?? LANDING_DEFAULTS.beforeAfter,
      features: (sections.features as LandingSections["features"]) ?? LANDING_DEFAULTS.features,
      howItWorks: (sections.howItWorks as LandingSections["howItWorks"]) ?? LANDING_DEFAULTS.howItWorks,
      integrations: (sections.integrations as LandingSections["integrations"]) ?? LANDING_DEFAULTS.integrations,
      comparison: (sections.comparison as LandingSections["comparison"]) ?? LANDING_DEFAULTS.comparison,
      pricing: (sections.pricing as LandingSections["pricing"]) ?? LANDING_DEFAULTS.pricing,
      calculator: (sections.calculator as LandingSections["calculator"]) ?? LANDING_DEFAULTS.calculator,
      faq: (sections.faq as LandingSections["faq"]) ?? LANDING_DEFAULTS.faq,
      finalCta: (sections.finalCta as LandingSections["finalCta"]) ?? LANDING_DEFAULTS.finalCta,
    };
  } catch {
    return LANDING_DEFAULTS;
  }
}

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

function FAQItemEl({ q, a }: { q: string; a: string }) {
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

// Feature icons are mapped by index position (matching the defaults)
const FEATURE_ICONS = [Zap, Timer, Users, Contact, CalendarClock, BarChart3, Inbox, StickyNote, Lock, Layers, Calendar, HelpCircle];
const INTEGRATION_ICONS = [MessageSquare, Mail, BookOpen, Calendar, Inbox, CheckCircle2];
const INTEGRATION_COLORS = ["#E01E5A", "#EA4335", "#000000", "#4285F4", "#7B68EE", "#F06A6A"];

/* ─── Page ─── */

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session;
  const content = await loadLandingContent();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-bold text-lg">Work OS</span>
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

      {/* ═══ HERO ═══ */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-6">
              <Zap className="h-3 w-3" />
              {content.hero.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              {content.hero.headline}
              <br />
              <span className="text-gray-400">{content.hero.headlineAccent}</span>
            </h1>
            <p className="text-sm font-medium text-gray-500 mb-4">{content.hero.subtext}</p>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              {content.hero.body}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-md hover:bg-gray-800 transition-colors text-sm"
              >
                {content.hero.cta1Label}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 border font-medium px-6 py-3 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                {content.hero.cta2Label}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-gray-400">
              {content.hero.trustSignals.map((signal, i) => (
                <span key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {signal}</span>
              ))}
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

      {/* ═══ METRICS BAR ═══ */}
      <section className="border-y bg-gray-50/50 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            {content.metrics.items.map((item, i) => (
              <div key={i}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM / PAIN POINTS ═══ */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.problems.heading}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{content.problems.body}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {content.problems.cards.map((card, i) => (
              <div key={i} className="p-6 rounded-xl bg-white border">
                <p className={`text-3xl font-bold mb-2 ${card.statColor || "text-gray-900"}`}>{card.stat}</p>
                <p className="text-sm font-medium mb-1">{card.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BEFORE / AFTER ═══ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.beforeAfter.heading}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-red-200 bg-red-50/50">
              <p className="text-sm font-semibold text-red-700 mb-4">Without Work OS</p>
              <ul className="space-y-3 text-sm text-gray-600">
                {content.beforeAfter.without.map((item, i) => (
                  <li key={i} className="flex gap-2"><span className="text-red-400 shrink-0">&#10005;</span> {item}</li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-green-200 bg-green-50/50">
              <p className="text-sm font-semibold text-green-700 mb-4">With Work OS</p>
              <ul className="space-y-3 text-sm text-gray-600">
                {content.beforeAfter.with.map((item, i) => (
                  <li key={i} className="flex gap-2"><span className="text-green-500 shrink-0">&#10003;</span> {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.features.heading}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{content.features.body}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.features.cards.map((card, i) => (
              <FeatureCard
                key={i}
                icon={FEATURE_ICONS[i] || HelpCircle}
                title={card.title}
                description={card.description}
                pro={card.pro}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.howItWorks.heading}</h2>
            <p className="text-gray-500 max-w-lg mx-auto">{content.howItWorks.body}</p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section id="integrations" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.integrations.heading}</h2>
            <p className="text-gray-500 max-w-lg mx-auto">{content.integrations.body}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {content.integrations.cards.map((card, i) => (
              <IntegrationCard
                key={i}
                icon={INTEGRATION_ICONS[i] || CheckCircle2}
                name={card.name}
                description={card.description}
                color={INTEGRATION_COLORS[i] || "#666"}
              />
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">{content.integrations.note}</p>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section id="compare" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.comparison.heading}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{content.comparison.body}</p>
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
                  <tr className="border-b bg-blue-50/50 font-semibold">
                    <td className="py-2.5 px-3 text-sm">Work OS</td>
                    {[true, true, true, true, true, true, true, true, true, true].map((v, i) => (
                      <td key={i} className="py-2.5 px-2 text-center">
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      </td>
                    ))}
                  </tr>
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
          <p className="text-center text-xs text-gray-400 mt-4">{content.comparison.note}</p>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="border-y py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.pricing.heading}</h2>
            <p className="text-gray-500 max-w-md mx-auto">{content.pricing.body}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {content.pricing.tiers.map((tier, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl bg-white relative ${
                  tier.highlighted ? "border-2 border-gray-900" : "border"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-900 text-white text-[10px] font-semibold rounded-full">
                    {tier.badge}
                  </div>
                )}
                <h3 className="font-semibold mb-1">{tier.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{tier.subtitle}</p>
                <div className="mb-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-gray-400">{tier.period}</span>
                </div>
                {tier.discount && (
                  <p className="text-[10px] text-gray-400 mb-4">{tier.discount}</p>
                )}
                {!tier.discount && <div className="mb-4" />}
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  {tier.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`block text-center px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${
                    tier.highlighted
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {tier.ctaLabel}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">{content.pricing.note}</p>
        </div>
      </section>

      {/* ═══ CALCULATOR ═══ */}
      <section id="calculator" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.calculator.heading}</h2>
            <p className="text-gray-500 max-w-lg mx-auto">{content.calculator.body}</p>
          </div>
          <ScheduleCalculator />
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">{content.faq.heading}</h2>
          </div>
          <div className="rounded-xl border bg-white divide-y">
            <div className="px-6">
              {content.faq.items.map((item, i) => (
                <FAQItemEl key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section id="signup" className="py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">{content.finalCta.heading}</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">{content.finalCta.body}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-8 py-3.5 rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              {content.finalCta.cta1Label}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 border font-medium px-8 py-3.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              {content.finalCta.cta2Label}
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
            {content.finalCta.trustSignals.map((signal, i) => (
              <span key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {signal}</span>
            ))}
          </div>

          {/* Referral Program */}
          <div className="mt-12 p-6 rounded-xl border bg-gray-50 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold">{content.finalCta.referralTitle}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{content.finalCta.referralBody}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {content.finalCta.referralBenefits.map((benefit, i) => (
                <span key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {benefit}</span>
              ))}
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
              <span>Work OS</span>
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
