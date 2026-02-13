"use client";

import { useState, useEffect } from "react";
import {
  Bug,
  Lightbulb,
  Plug,
  MessageSquare,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  ChevronDown,
  BookOpen,
  Search,
  ArrowLeft,
  Star,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────

const TICKET_TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug, description: "Something isn't working right" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, description: "Suggest a new feature or improvement" },
  { value: "integration", label: "Integration Request", icon: Plug, description: "Request a new integration (e.g., Asana, Trello)" },
  { value: "feedback", label: "General Feedback", icon: MessageSquare, description: "Share your thoughts on the product" },
  { value: "testimonial", label: "Testimonial", icon: Star, description: "Share how MyTime has helped your business" },
  { value: "support", label: "Help / Support", icon: HelpCircle, description: "I need help with something" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

const KB_CATEGORIES: Record<string, { label: string; icon: string }> = {
  "getting-started": { label: "Getting Started", icon: "rocket" },
  features: { label: "Features", icon: "star" },
  integrations: { label: "Integrations", icon: "plug" },
  billing: { label: "Billing", icon: "credit-card" },
  troubleshooting: { label: "Troubleshooting", icon: "wrench" },
};

type Ticket = {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

type KBArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string;
  updatedAt: string;
};

// ─── Component ─────────────────────────────────────

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [type, setType] = useState("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // KB state
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [kbSearch, setKbSearch] = useState("");
  const [kbCategory, setKbCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [kbLoading, setKbLoading] = useState(true);

  // Tab: "kb" or "submit"
  const [activeTab, setActiveTab] = useState<"kb" | "submit">("kb");

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTickets(data); });

    fetch("/api/kb")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setKbArticles(data);
        setKbLoading(false);
      })
      .catch(() => setKbLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        setSubmitting(false);
        return;
      }

      const ticket = await res.json();
      setTickets([ticket, ...tickets]);
      setSubject("");
      setMessage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openArticle(slug: string) {
    try {
      const res = await fetch(`/api/kb?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.id) setSelectedArticle(data);
    } catch {
      // ignore
    }
  }

  // Filter KB articles
  const filteredArticles = kbArticles.filter((a) => {
    if (kbCategory && a.category !== kbCategory) return false;
    if (kbSearch) {
      const q = kbSearch.toLowerCase();
      return a.title.toLowerCase().includes(q) || (a.tags && a.tags.toLowerCase().includes(q));
    }
    return true;
  });

  // Group articles by category
  const articlesByCategory: Record<string, KBArticle[]> = {};
  for (const a of filteredArticles) {
    if (!articlesByCategory[a.category]) articlesByCategory[a.category] = [];
    articlesByCategory[a.category].push(a);
  }

  // Simple markdown renderer (handles headers, bold, links, lists, paragraphs)
  function renderMarkdown(md: string) {
    const lines = md.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    function flushList() {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-3">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">{renderInline(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
      inList = false;
    }

    function renderInline(text: string): React.ReactNode {
      // Handle bold, links, inline code
      const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {linkMatch[1]}
            </a>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>;
        }
        return part;
      });
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("## ")) {
        flushList();
        elements.push(<h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>);
      } else if (line.startsWith("### ")) {
        flushList();
        elements.push(<h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>);
      } else if (line.startsWith("# ")) {
        flushList();
        elements.push(<h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        inList = true;
        listItems.push(line.slice(2));
      } else if (line.startsWith("---")) {
        flushList();
        elements.push(<hr key={i} className="my-4" />);
      } else if (line.trim() === "") {
        flushList();
      } else {
        flushList();
        elements.push(<p key={i} className="text-sm mb-2">{renderInline(line)}</p>);
      }
    }
    flushList();

    return <div>{elements}</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search our knowledge base or submit a request.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => { setActiveTab("kb"); setSelectedArticle(null); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "kb" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab("submit")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "submit" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Submit Request
          {tickets.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{tickets.length}</span>
          )}
        </button>
      </div>

      {/* ─── Knowledge Base Tab ─── */}
      {activeTab === "kb" && !selectedArticle && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={kbSearch}
              onChange={(e) => setKbSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full h-10 pl-10 pr-4 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setKbCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                !kbCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {Object.entries(KB_CATEGORIES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setKbCategory(kbCategory === key ? null : key)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  kbCategory === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Articles */}
          {kbLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading articles...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {kbSearch ? "No articles match your search." : "No articles published yet."}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Can&apos;t find what you need?{" "}
                <button onClick={() => setActiveTab("submit")} className="text-primary underline">
                  Submit a support request
                </button>
              </p>
            </div>
          ) : (
            Object.entries(articlesByCategory).map(([category, articles]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {KB_CATEGORIES[category]?.label || category}
                </h3>
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => openArticle(article.slug)}
                    className="w-full text-left rounded-lg border bg-card px-4 py-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{article.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(article.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {article.tags && (
                      <div className="flex gap-1 mt-1">
                        {article.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                          <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Article detail ─── */}
      {activeTab === "kb" && selectedArticle && (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to articles
          </button>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {KB_CATEGORIES[selectedArticle.category]?.label || selectedArticle.category}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-4">{selectedArticle.title}</h2>
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(selectedArticle.content)}
            </div>
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(selectedArticle.updatedAt).toLocaleDateString(undefined, {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Didn&apos;t find your answer?{" "}
                <button onClick={() => setActiveTab("submit")} className="text-primary underline">
                  Submit a support request
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Submit Request Tab ─── */}
      {activeTab === "submit" && (
        <>
          {/* Submit form */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Submit a request</h2>

            {success && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Your request has been submitted. We&apos;ll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">What can we help with?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TICKET_TYPES.map((t) => {
                    const Icon = t.icon;
                    const selected = type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`flex items-start gap-3 p-3 rounded-md border text-left text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-accent"
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your request"
                  required
                  className="w-full h-10 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue, idea, or feedback in detail..."
                  required
                  rows={5}
                  className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-5 py-2.5 rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Request"}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* History */}
          {tickets.length > 0 && (
            <div className="rounded-lg border bg-card">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <h2 className="font-semibold">Your previous requests ({tickets.length})</h2>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </button>
              {showHistory && (
                <div className="border-t divide-y">
                  {tickets.map((ticket) => {
                    const status = STATUS_LABELS[ticket.status] || STATUS_LABELS.open;
                    const typeInfo = TICKET_TYPES.find((t) => t.value === ticket.type);
                    return (
                      <div key={ticket.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            {typeInfo && <typeInfo.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                            <p className="text-sm font-medium">{ticket.subject}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{ticket.message}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
