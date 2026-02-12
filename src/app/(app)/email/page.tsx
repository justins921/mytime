"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Timer,
  Calendar,
  Inbox,
  KanbanSquare,
  GripVertical,
  Plus,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

interface GmailAccount {
  id: string;
  email: string;
  clientId: string | null;
  client: { id: string; name: string; color: string } | null;
}

interface Email {
  id: string;
  threadId: string;
  labelIds: string[];
  from: string;
  subject: string;
  date: string;
  snippet: string;
  internalDate: string;
}

interface EmailDetail extends Email {
  to: string;
  body: string;
}

interface EmailCard {
  id: string;
  gmailMessageId: string;
  accountId: string;
  subject: string;
  fromAddress: string;
  snippet: string;
  receivedAt: string | null;
  status: string;
  sortOrder: number;
  account: {
    id: string;
    email: string;
    clientId: string | null;
    client: { id: string; name: string; color: string } | null;
  };
}

interface WorkContext {
  clientId: string | null;
  client: { id: string; name: string; color: string } | null;
  source: "timer" | "schedule" | "none";
}

const KANBAN_COLUMNS = [
  { key: "Todo", label: "To Do", color: "border-blue-400" },
  { key: "InProgress", label: "In Progress", color: "border-yellow-400" },
  { key: "Done", label: "Done", color: "border-green-400" },
];

// ─── Component ────────────────────────────────────────────

export default function EmailPage() {
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [cards, setCards] = useState<EmailCard[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [context, setContext] = useState<WorkContext>({ clientId: null, client: null, source: "none" });
  const [view, setView] = useState<"inbox" | "kanban">("inbox");
  const [error, setError] = useState("");

  // Reply state
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch accounts + context on mount
  useEffect(() => {
    fetch("/api/slack/context")
      .then((r) => r.json())
      .then(setContext)
      .catch(() => {});
    fetch("/api/gmail/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAccounts(data);
      });
  }, []);

  // Auto-select account based on focus mode
  useEffect(() => {
    if (accounts.length === 0) return;
    if (focusMode && context.clientId) {
      const matched = accounts.find((a) => a.clientId === context.clientId);
      if (matched) {
        setActiveAccountId(matched.id);
        return;
      }
    }
    if (!activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, focusMode, context, activeAccountId]);

  // Fetch emails when account changes
  const fetchEmails = useCallback(async (acctId: string) => {
    setLoadingEmails(true);
    setError("");
    setEmails([]);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/gmail/emails?accountId=${acctId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEmails(data.emails || []);
      }
    } catch {
      setError("Failed to load emails");
    }
    setLoadingEmails(false);
  }, []);

  useEffect(() => {
    if (activeAccountId) {
      fetchEmails(activeAccountId);
    }
  }, [activeAccountId, fetchEmails]);

  // Fetch kanban cards
  const fetchCards = useCallback(async () => {
    const params = new URLSearchParams();
    if (focusMode && context.clientId) {
      params.set("clientId", context.clientId);
    }
    try {
      const res = await fetch(`/api/gmail/cards?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setCards(data);
    } catch {
      // ignore
    }
  }, [focusMode, context]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Fetch email detail
  async function openEmail(email: Email) {
    if (!activeAccountId) return;
    setLoadingDetail(true);
    setReplyTo(null);
    try {
      const res = await fetch(
        `/api/gmail/emails?accountId=${activeAccountId}&messageId=${email.id}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSelectedEmail(data);
      }
    } catch {
      setError("Failed to load email");
    }
    setLoadingDetail(false);
  }

  // Send reply
  async function sendReply() {
    if (!selectedEmail || !activeAccountId || !replyBody.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccountId,
          to: selectedEmail.from,
          subject: selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
          body: replyBody.trim(),
          threadId: selectedEmail.threadId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setReplyBody("");
        setReplyTo(null);
      } else {
        setError(data.error || "Failed to send");
      }
    } catch {
      setError("Failed to send reply");
    }
    setSending(false);
  }

  // Add email to kanban board
  async function addToKanban(email: Email, status = "Todo") {
    if (!activeAccountId) return;
    try {
      const res = await fetch("/api/gmail/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmailMessageId: email.id,
          accountId: activeAccountId,
          subject: email.subject,
          fromAddress: email.from,
          snippet: email.snippet,
          receivedAt: email.internalDate ? new Date(parseInt(email.internalDate)).toISOString() : null,
          status,
        }),
      });
      const card = await res.json();
      if (card.id) {
        setCards((prev) => {
          const existing = prev.findIndex((c) => c.gmailMessageId === email.id && c.accountId === activeAccountId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = card;
            return updated;
          }
          return [...prev, card];
        });
      }
    } catch {
      setError("Failed to add to board");
    }
  }

  // Move card to different column
  async function moveCard(cardId: string, newStatus: string) {
    try {
      const res = await fetch("/api/gmail/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, status: newStatus }),
      });
      const updated = await res.json();
      if (updated.id) {
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
    } catch {
      setError("Failed to move card");
    }
  }

  // Remove card from board
  async function removeCard(cardId: string) {
    try {
      await fetch("/api/gmail/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId }),
      });
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch {
      setError("Failed to remove card");
    }
  }

  // Format date
  function formatDate(dateStr: string) {
    try {
      const date = dateStr.match(/^\d+$/) ? new Date(parseInt(dateStr)) : new Date(dateStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  }

  // Parse "From" header to just name
  function parseSender(from: string) {
    const match = from.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : from.split("@")[0];
  }

  // Determine visible accounts
  const visibleAccounts =
    focusMode && context.clientId
      ? accounts.filter((a) => a.clientId === context.clientId)
      : accounts;

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  // Check if email is on kanban board
  function getCardForEmail(emailId: string): EmailCard | undefined {
    return cards.find((c) => c.gmailMessageId === emailId && c.accountId === activeAccountId);
  }

  // ─── Empty state ─────────────────────────────────────────

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">No Gmail accounts connected</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Go to Settings to connect your Gmail accounts and map them to clients.
          </p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/settings")}>
          Go to Settings
        </Button>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Email</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <Button
              variant={view === "inbox" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setView("inbox")}
            >
              <Inbox className="h-3.5 w-3.5 mr-1" />
              Inbox
            </Button>
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setView("kanban")}
            >
              <KanbanSquare className="h-3.5 w-3.5 mr-1" />
              Board
            </Button>
          </div>
          {/* Context indicator */}
          {context.client && (
            <div className="flex items-center gap-1.5 text-xs">
              {context.source === "timer" ? (
                <Timer className="h-3.5 w-3.5" />
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              <span className="text-muted-foreground">Working on:</span>
              <Badge
                variant="outline"
                style={{ borderColor: context.client.color, color: context.client.color }}
              >
                {context.client.name}
              </Badge>
            </div>
          )}
          {/* Focus mode toggle */}
          <div className="flex items-center gap-1.5">
            {focusMode ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Switch checked={focusMode} onCheckedChange={setFocusMode} />
            <Label className="text-xs">Focus</Label>
          </div>
        </div>
      </div>

      {/* Focus mode notice */}
      {focusMode && context.client && (
        <p className="text-xs text-muted-foreground">
          Focus mode: only showing emails from accounts mapped to{" "}
          <strong>{context.client.name}</strong>.
          {visibleAccounts.length === 0 && (
            <span className="text-amber-600 ml-1">
              No accounts mapped to this client. Map one in Settings or turn off Focus mode.
            </span>
          )}
        </p>
      )}
      {focusMode && !context.client && (
        <p className="text-xs text-muted-foreground">
          Focus mode is on, but no active timer or schedule block right now. Showing all accounts.
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Account tabs */}
      {view === "inbox" && visibleAccounts.length > 1 && (
        <div className="flex gap-1">
          {visibleAccounts.map((acct) => (
            <Button
              key={acct.id}
              variant={acct.id === activeAccountId ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAccountId(acct.id)}
              className="text-xs"
            >
              {acct.email}
              {acct.client && (
                <span
                  className="ml-1.5 inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: acct.client.color }}
                />
              )}
            </Button>
          ))}
        </div>
      )}

      {/* ─── Inbox View ─── */}
      {view === "inbox" && (
        <div className="flex gap-3 h-[calc(100vh-220px)] min-h-[400px]">
          {/* Email list sidebar */}
          <Card className="w-96 shrink-0 flex flex-col">
            <div className="p-2 border-b flex items-center justify-between">
              <span className="text-xs font-medium truncate">
                {activeAccount?.email || "Select account"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => activeAccountId && fetchEmails(activeAccountId)}
              >
                <RefreshCw className={`h-3 w-3 ${loadingEmails ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingEmails && (
                <p className="text-xs text-muted-foreground text-center py-8">Loading emails...</p>
              )}

              {!loadingEmails && emails.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No emails found</p>
              )}

              {emails.map((email) => {
                const card = getCardForEmail(email.id);
                const isUnread = email.labelIds?.includes("UNREAD");
                return (
                  <button
                    key={email.id}
                    onClick={() => openEmail(email)}
                    className={`w-full text-left px-3 py-2.5 border-b transition-colors ${
                      selectedEmail?.id === email.id
                        ? "bg-primary/10"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${isUnread ? "font-semibold" : ""}`}>
                        {parseSender(email.from)}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {card && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {card.status}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(email.internalDate || email.date)}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isUnread ? "font-medium" : "text-muted-foreground"}`}>
                      {email.subject || "(no subject)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {email.snippet}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Email detail pane */}
          <Card className="flex-1 flex flex-col min-w-0">
            {selectedEmail ? (
              <>
                <div className="p-4 border-b space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate flex-1">
                      {selectedEmail.subject || "(no subject)"}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {!getCardForEmail(selectedEmail.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => addToKanban(selectedEmail as unknown as Email)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Board
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {getCardForEmail(selectedEmail.id)?.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedEmail.from}</span>
                    <span>&rarr;</span>
                    <span className="truncate">{selectedEmail.to}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedEmail.date}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loadingDetail ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                      {selectedEmail.body}
                    </pre>
                  )}
                </div>

                {/* Reply area */}
                <CardContent className="p-3 border-t">
                  {replyTo === selectedEmail.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder={`Reply to ${parseSender(selectedEmail.from)}...`}
                        className="w-full h-24 text-sm border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        disabled={sending}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={!replyBody.trim() || sending} onClick={sendReply}>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {sending ? "Sending..." : "Send Reply"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setReplyTo(null); setReplyBody(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setReplyTo(selectedEmail.id)}>
                      Reply
                    </Button>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Mail className="h-8 w-8 mb-2" />
                <p className="text-sm">Select an email to read</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── Kanban View ─── */}
      {view === "kanban" && (
        <div className="flex gap-3 h-[calc(100vh-220px)] min-h-[400px] overflow-x-auto">
          {KANBAN_COLUMNS.map((col) => {
            const columnCards = cards.filter((c) => c.status === col.key);
            return (
              <div
                key={col.key}
                className={`w-80 shrink-0 flex flex-col rounded-lg border-t-4 ${col.color} bg-muted/30`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("bg-muted/60");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("bg-muted/60");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("bg-muted/60");
                  const cardId = e.dataTransfer.getData("text/plain");
                  if (cardId) moveCard(cardId, col.key);
                }}
              >
                <div className="p-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnCards.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                  {columnCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", card.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="bg-background rounded-md border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {card.subject || "(no subject)"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {card.fromAddress ? parseSender(card.fromAddress) : "Unknown"}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                            {card.snippet}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            {card.account?.client && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                                style={{ borderColor: card.account.client.color, color: card.account.client.color }}
                              >
                                {card.account.client.name}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {card.account?.email}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCard(card.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-2 ml-6">
                        {KANBAN_COLUMNS.filter((c) => c.key !== col.key).map((target) => (
                          <Button
                            key={target.key}
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] px-1.5 text-muted-foreground"
                            onClick={() => moveCard(card.id, target.key)}
                          >
                            {target.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {columnCards.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      {col.key === "Todo"
                        ? "Add emails from the Inbox view"
                        : "Drag cards here"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
