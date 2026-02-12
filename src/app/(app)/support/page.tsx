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
} from "lucide-react";

const TICKET_TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug, description: "Something isn't working right" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, description: "Suggest a new feature or improvement" },
  { value: "integration", label: "Integration Request", icon: Plug, description: "Request a new integration (e.g., Asana, Trello)" },
  { value: "feedback", label: "General Feedback", icon: MessageSquare, description: "Share your thoughts on the product" },
  { value: "support", label: "Help / Support", icon: HelpCircle, description: "I need help with something" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

type Ticket = {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [type, setType] = useState("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTickets(data); });
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

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Report a bug, request a feature, or get help.
        </p>
      </div>

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
    </div>
  );
}
