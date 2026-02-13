"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  RotateCcw,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  LANDING_DEFAULTS,
  SECTION_LABELS,
  type LandingSections,
} from "@/lib/landing-defaults";

type SectionKey = keyof LandingSections;

export function LandingEditor() {
  const [sections, setSections] = useState<LandingSections>(LANDING_DEFAULTS);
  const [activeSection, setActiveSection] = useState<SectionKey>("hero");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/landing");
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch {
      // use defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  async function saveSection() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeSection, content: sections[activeSection] }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  async function resetSection() {
    if (!confirm(`Reset "${SECTION_LABELS[activeSection]}" to defaults? This cannot be undone.`)) return;
    try {
      await fetch("/api/admin/landing", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeSection }),
      });
      setSections({ ...sections, [activeSection]: LANDING_DEFAULTS[activeSection] });
    } catch {
      // ignore
    }
  }

  // Helper to update a nested section value
  function updateSection<K extends SectionKey>(key: K, data: Partial<LandingSections[K]>) {
    setSections({ ...sections, [key]: { ...sections[key], ...data } });
  }

  if (loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Loading landing page content...</div>;
  }

  const s = sections[activeSection];

  return (
    <div className="space-y-4">
      {/* Section selector + save bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as SectionKey)}
            className="w-full sm:w-64 h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
          <button
            onClick={resetSection}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={saveSection}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Section"}
          </button>
        </div>
      </div>

      {/* Section editors */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        {activeSection === "hero" && <HeroEditor data={sections.hero} onChange={(d) => updateSection("hero", d)} />}
        {activeSection === "metrics" && <MetricsEditor data={sections.metrics} onChange={(d) => setSections({ ...sections, metrics: d })} />}
        {activeSection === "problems" && <ProblemsEditor data={sections.problems} onChange={(d) => setSections({ ...sections, problems: d })} />}
        {activeSection === "beforeAfter" && <BeforeAfterEditor data={sections.beforeAfter} onChange={(d) => setSections({ ...sections, beforeAfter: d })} />}
        {activeSection === "features" && <FeaturesEditor data={sections.features} onChange={(d) => setSections({ ...sections, features: d })} />}
        {activeSection === "howItWorks" && <SimpleEditor data={sections.howItWorks} onChange={(d) => updateSection("howItWorks", d)} fields={[{ key: "heading", label: "Heading" }, { key: "body", label: "Body", multiline: true }]} />}
        {activeSection === "integrations" && <IntegrationsEditor data={sections.integrations} onChange={(d) => setSections({ ...sections, integrations: d })} />}
        {activeSection === "comparison" && <SimpleEditor data={sections.comparison} onChange={(d) => updateSection("comparison", d)} fields={[{ key: "heading", label: "Heading" }, { key: "body", label: "Body", multiline: true }, { key: "note", label: "Footer Note" }]} />}
        {activeSection === "pricing" && <PricingEditor data={sections.pricing} onChange={(d) => setSections({ ...sections, pricing: d })} />}
        {activeSection === "calculator" && <SimpleEditor data={sections.calculator} onChange={(d) => updateSection("calculator", d)} fields={[{ key: "heading", label: "Heading" }, { key: "body", label: "Body", multiline: true }]} />}
        {activeSection === "faq" && <FAQEditor data={sections.faq} onChange={(d) => setSections({ ...sections, faq: d })} />}
        {activeSection === "finalCta" && <FinalCtaEditor data={sections.finalCta} onChange={(d) => setSections({ ...sections, finalCta: d })} />}
      </div>
    </div>
  );
}

// ─── Input helpers ─────────────────────────────────

function Field({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function ListEditor({ label, items, onChange }: {
  label: string; items: string[]; onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">{label}</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
            className="flex-1 h-8 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="p-1.5 text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1 text-xs text-primary font-medium"
      >
        <Plus className="h-3 w-3" /> Add item
      </button>
    </div>
  );
}

// ─── Section editors ─────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SimpleEditor({ data, onChange, fields }: { data: any; onChange: (d: any) => void; fields: { key: string; label: string; multiline?: boolean }[] }) {
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <Field key={f.key} label={f.label} value={data[f.key] || ""} onChange={(v) => onChange({ [f.key]: v })} multiline={f.multiline} />
      ))}
    </div>
  );
}

function HeroEditor({ data, onChange }: { data: LandingSections["hero"]; onChange: (d: Partial<LandingSections["hero"]>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Badge text" value={data.badge} onChange={(v) => onChange({ badge: v })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Headline" value={data.headline} onChange={(v) => onChange({ headline: v })} />
        <Field label="Headline accent (gray text)" value={data.headlineAccent} onChange={(v) => onChange({ headlineAccent: v })} />
      </div>
      <Field label="Subtext (small text above body)" value={data.subtext} onChange={(v) => onChange({ subtext: v })} />
      <Field label="Body paragraph" value={data.body} onChange={(v) => onChange({ body: v })} multiline />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Primary CTA label" value={data.cta1Label} onChange={(v) => onChange({ cta1Label: v })} />
        <Field label="Secondary CTA label" value={data.cta2Label} onChange={(v) => onChange({ cta2Label: v })} />
      </div>
      <ListEditor label="Trust signals" items={data.trustSignals} onChange={(v) => onChange({ trustSignals: v })} />
    </div>
  );
}

function MetricsEditor({ data, onChange }: { data: LandingSections["metrics"]; onChange: (d: LandingSections["metrics"]) => void }) {
  const items = data.items;
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium">Metrics</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-muted-foreground">Value</label>
            <input
              type="text" value={item.value}
              onChange={(e) => { const next = [...items]; next[i] = { ...item, value: e.target.value }; onChange({ items: next }); }}
              className="w-full h-8 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-muted-foreground">Label</label>
            <input
              type="text" value={item.label}
              onChange={(e) => { const next = [...items]; next[i] = { ...item, label: e.target.value }; onChange({ items: next }); }}
              className="w-full h-8 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button onClick={() => onChange({ items: items.filter((_, j) => j !== i) })} className="p-1.5 text-muted-foreground hover:text-red-600 mb-0.5">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange({ items: [...items, { value: "", label: "" }] })} className="inline-flex items-center gap-1 text-xs text-primary font-medium">
        <Plus className="h-3 w-3" /> Add metric
      </button>
    </div>
  );
}

function ProblemsEditor({ data, onChange }: { data: LandingSections["problems"]; onChange: (d: LandingSections["problems"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <Field label="Body" value={data.body} onChange={(v) => onChange({ ...data, body: v })} multiline />
      <label className="text-xs font-medium">Pain point cards</label>
      {data.cards.map((card, i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
            <button onClick={() => onChange({ ...data, cards: data.cards.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Stat" value={card.stat} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, stat: v }; onChange({ ...data, cards: next }); }} />
            <Field label="Stat color class" value={card.statColor} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, statColor: v }; onChange({ ...data, cards: next }); }} placeholder="text-gray-900" />
          </div>
          <Field label="Title" value={card.title} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, title: v }; onChange({ ...data, cards: next }); }} />
          <Field label="Description" value={card.description} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, description: v }; onChange({ ...data, cards: next }); }} multiline />
        </div>
      ))}
      <button onClick={() => onChange({ ...data, cards: [...data.cards, { stat: "", statColor: "text-gray-900", title: "", description: "" }] })} className="inline-flex items-center gap-1 text-xs text-primary font-medium">
        <Plus className="h-3 w-3" /> Add card
      </button>
    </div>
  );
}

function BeforeAfterEditor({ data, onChange }: { data: LandingSections["beforeAfter"]; onChange: (d: LandingSections["beforeAfter"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListEditor label="Without MyTime (pain points)" items={data.without} onChange={(v) => onChange({ ...data, without: v })} />
        <ListEditor label="With MyTime (benefits)" items={data.with} onChange={(v) => onChange({ ...data, with: v })} />
      </div>
    </div>
  );
}

function FeaturesEditor({ data, onChange }: { data: LandingSections["features"]; onChange: (d: LandingSections["features"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <Field label="Body" value={data.body} onChange={(v) => onChange({ ...data, body: v })} multiline />
      <div className="space-y-2">
        <label className="text-xs font-medium">Feature cards (icons are fixed by position)</label>
        {data.cards.map((card, i) => (
          <details key={i} className="group rounded-md border">
            <summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-sm">
              <span className="font-medium text-xs">{card.title || `Card ${i + 1}`}{card.pro ? " (Pro)" : ""}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-3 pb-3 space-y-2 border-t pt-2">
              <Field label="Title" value={card.title} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, title: v }; onChange({ ...data, cards: next }); }} />
              <Field label="Description" value={card.description} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, description: v }; onChange({ ...data, cards: next }); }} multiline />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={!!card.pro} onChange={(e) => { const next = [...data.cards]; next[i] = { ...card, pro: e.target.checked }; onChange({ ...data, cards: next }); }} />
                Pro badge
              </label>
              <button onClick={() => onChange({ ...data, cards: data.cards.filter((_, j) => j !== i) })} className="text-xs text-red-600 hover:underline">Remove card</button>
            </div>
          </details>
        ))}
        <button onClick={() => onChange({ ...data, cards: [...data.cards, { title: "", description: "" }] })} className="inline-flex items-center gap-1 text-xs text-primary font-medium">
          <Plus className="h-3 w-3" /> Add feature
        </button>
      </div>
    </div>
  );
}

function IntegrationsEditor({ data, onChange }: { data: LandingSections["integrations"]; onChange: (d: LandingSections["integrations"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <Field label="Body" value={data.body} onChange={(v) => onChange({ ...data, body: v })} multiline />
      <Field label="Footer note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} />
      <label className="text-xs font-medium">Integration cards (icons/colors are fixed by position)</label>
      {data.cards.map((card, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1"><Field label="Name" value={card.name} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, name: v }; onChange({ ...data, cards: next }); }} /></div>
          <div className="flex-1"><Field label="Description" value={card.description} onChange={(v) => { const next = [...data.cards]; next[i] = { ...card, description: v }; onChange({ ...data, cards: next }); }} /></div>
          <button onClick={() => onChange({ ...data, cards: data.cards.filter((_, j) => j !== i) })} className="p-1.5 text-muted-foreground hover:text-red-600 mb-0.5">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange({ ...data, cards: [...data.cards, { name: "", description: "" }] })} className="inline-flex items-center gap-1 text-xs text-primary font-medium">
        <Plus className="h-3 w-3" /> Add integration
      </button>
    </div>
  );
}

function PricingEditor({ data, onChange }: { data: LandingSections["pricing"]; onChange: (d: LandingSections["pricing"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <Field label="Body" value={data.body} onChange={(v) => onChange({ ...data, body: v })} />
      <Field label="Footer note" value={data.note} onChange={(v) => onChange({ ...data, note: v })} />
      <label className="text-xs font-medium">Pricing tiers</label>
      {data.tiers.map((tier, i) => (
        <details key={i} className="group rounded-md border">
          <summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-sm">
            <span className="font-medium text-xs">{tier.name || `Tier ${i + 1}`}{tier.highlighted ? " (highlighted)" : ""}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-3 pb-3 space-y-2 border-t pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Name" value={tier.name} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, name: v }; onChange({ ...data, tiers: next }); }} />
              <Field label="Badge (optional)" value={tier.badge || ""} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, badge: v || undefined }; onChange({ ...data, tiers: next }); }} placeholder="e.g. Most Popular" />
            </div>
            <Field label="Subtitle" value={tier.subtitle} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, subtitle: v }; onChange({ ...data, tiers: next }); }} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Field label="Price" value={tier.price} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, price: v }; onChange({ ...data, tiers: next }); }} />
              <Field label="Period" value={tier.period} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, period: v }; onChange({ ...data, tiers: next }); }} />
              <Field label="CTA label" value={tier.ctaLabel} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, ctaLabel: v }; onChange({ ...data, tiers: next }); }} />
            </div>
            <Field label="Discount text (optional)" value={tier.discount || ""} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, discount: v || undefined }; onChange({ ...data, tiers: next }); }} />
            <ListEditor label="Features" items={tier.features} onChange={(v) => { const next = [...data.tiers]; next[i] = { ...tier, features: v }; onChange({ ...data, tiers: next }); }} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!!tier.highlighted} onChange={(e) => { const next = [...data.tiers]; next[i] = { ...tier, highlighted: e.target.checked }; onChange({ ...data, tiers: next }); }} />
              Highlighted (border emphasis)
            </label>
          </div>
        </details>
      ))}
    </div>
  );
}

function FAQEditor({ data, onChange }: { data: LandingSections["faq"]; onChange: (d: LandingSections["faq"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <label className="text-xs font-medium">FAQ items</label>
      {data.items.map((item, i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Q{i + 1}</span>
            <button onClick={() => onChange({ ...data, items: data.items.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Field label="Question" value={item.q} onChange={(v) => { const next = [...data.items]; next[i] = { ...item, q: v }; onChange({ ...data, items: next }); }} />
          <Field label="Answer" value={item.a} onChange={(v) => { const next = [...data.items]; next[i] = { ...item, a: v }; onChange({ ...data, items: next }); }} multiline />
        </div>
      ))}
      <button onClick={() => onChange({ ...data, items: [...data.items, { q: "", a: "" }] })} className="inline-flex items-center gap-1 text-xs text-primary font-medium">
        <Plus className="h-3 w-3" /> Add FAQ
      </button>
    </div>
  );
}

function FinalCtaEditor({ data, onChange }: { data: LandingSections["finalCta"]; onChange: (d: LandingSections["finalCta"]) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => onChange({ ...data, heading: v })} />
      <Field label="Body" value={data.body} onChange={(v) => onChange({ ...data, body: v })} multiline />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Primary CTA label" value={data.cta1Label} onChange={(v) => onChange({ ...data, cta1Label: v })} />
        <Field label="Secondary CTA label" value={data.cta2Label} onChange={(v) => onChange({ ...data, cta2Label: v })} />
      </div>
      <ListEditor label="Trust signals" items={data.trustSignals} onChange={(v) => onChange({ ...data, trustSignals: v })} />
      <hr className="my-2" />
      <Field label="Referral title" value={data.referralTitle} onChange={(v) => onChange({ ...data, referralTitle: v })} />
      <Field label="Referral body" value={data.referralBody} onChange={(v) => onChange({ ...data, referralBody: v })} multiline />
      <ListEditor label="Referral benefits" items={data.referralBenefits} onChange={(v) => onChange({ ...data, referralBenefits: v })} />
    </div>
  );
}
