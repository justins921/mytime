"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Hash,
  User,
  Users,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Timer,
  Calendar,
  ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

interface SlackWorkspace {
  id: string;
  teamId: string;
  teamName: string;
  clientId: string | null;
  client: { id: string; name: string; color: string } | null;
}

interface Conversation {
  id: string;
  name: string;
  is_channel: boolean;
  is_im: boolean;
  is_mpim: boolean;
  user: string | null;
  workspaceId: string;
  workspaceName: string;
  has_unreads: boolean;
  unread_count: number;
}

interface SlackMessage {
  ts: string;
  user?: string;
  text: string;
  subtype?: string;
  bot_id?: string;
}

interface WorkContext {
  clientId: string | null;
  client: { id: string; name: string; color: string } | null;
  source: "timer" | "schedule" | "none";
}

const ALL_WORKSPACES = "__all__";

// ─── Component ────────────────────────────────────────────

export default function MessagesPage() {
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(ALL_WORKSPACES);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [context, setContext] = useState<WorkContext>({ clientId: null, client: null, source: "none" });
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch work context + workspaces on mount
  useEffect(() => {
    fetch("/api/slack/context")
      .then((r) => r.json())
      .then(setContext)
      .catch(() => {});
    fetch("/api/slack/workspaces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWorkspaces(data);
      })
      .catch(() => {});
  }, []);

  // Auto-select workspace based on focus mode + context
  useEffect(() => {
    if (workspaces.length === 0) return;

    if (focusMode && context.clientId) {
      const matched = workspaces.find((w) => w.clientId === context.clientId);
      if (matched) {
        setActiveWorkspaceId(matched.id);
        return;
      }
    }
    // Default to unified view when not in focus mode
    if (!focusMode) {
      setActiveWorkspaceId(ALL_WORKSPACES);
    } else {
      setActiveWorkspaceId((prev) => prev === ALL_WORKSPACES ? workspaces[0].id : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces, focusMode, context.clientId]);

  // Determine visible workspaces (memoized to prevent infinite re-renders)
  const visibleWorkspaces = useMemo(
    () =>
      focusMode && context.clientId
        ? workspaces.filter((w) => w.clientId === context.clientId)
        : workspaces,
    [focusMode, context.clientId, workspaces]
  );

  // Get workspace IDs to fetch
  const getWorkspaceIdsToFetch = useCallback((): string => {
    if (activeWorkspaceId === ALL_WORKSPACES) {
      return visibleWorkspaces.map((w) => w.id).join(",");
    }
    return activeWorkspaceId;
  }, [activeWorkspaceId, visibleWorkspaces]);

  // Fetch conversations when workspace changes
  const fetchConversations = useCallback(async () => {
    const wsIds = getWorkspaceIdsToFetch();
    if (!wsIds) return;
    setLoadingConvos(true);
    setError("");
    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
    try {
      const res = await fetch(`/api/slack/conversations?workspaceId=${encodeURIComponent(wsIds)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setConversations(data.conversations || []);
        setUserMap(data.userMap || {});
      }
    } catch {
      setError("Failed to load conversations");
    }
    setLoadingConvos(false);
  }, [getWorkspaceIdsToFetch]);

  useEffect(() => {
    if (workspaces.length > 0) {
      fetchConversations();
    }
  }, [activeWorkspaceId, fetchConversations, workspaces.length]);

  // Poll for unread updates every 30 seconds
  useEffect(() => {
    if (workspaces.length === 0) return;
    const interval = setInterval(async () => {
      const wsIds = getWorkspaceIdsToFetch();
      if (!wsIds) return;
      try {
        const res = await fetch(`/api/slack/conversations?workspaceId=${encodeURIComponent(wsIds)}`);
        const data = await res.json();
        if (data.conversations) {
          setConversations(data.conversations);
          if (data.userMap) setUserMap(data.userMap);
        }
      } catch {
        // Silent fail on poll
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [workspaces.length, getWorkspaceIdsToFetch]);

  // Fetch messages when conversation changes
  async function fetchMessages(conv: Conversation) {
    setActiveConversation(conv);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(
        `/api/slack/messages?workspaceId=${conv.workspaceId}&channel=${conv.id}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Slack returns newest first, reverse for chronological display
        setMessages((data.messages || []).reverse());
      }
    } catch {
      setError("Failed to load messages");
    }
    setLoadingMessages(false);
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  async function sendMessage() {
    if (!messageInput.trim() || !activeConversation || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/slack/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeConversation.workspaceId,
          channel: activeConversation.id,
          text: messageInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessageInput("");
        // Refresh messages
        fetchMessages(activeConversation);
      } else {
        setError(data.error || "Failed to send");
      }
    } catch {
      setError("Failed to send message");
    }
    setSending(false);
  }

  // Format Slack timestamp
  function formatTime(ts: string) {
    const date = new Date(parseFloat(ts) * 1000);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDate(ts: string) {
    const date = new Date(parseFloat(ts) * 1000);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function resolveUser(userId?: string) {
    if (!userId) return "System";
    return userMap[userId] || userId;
  }

  // Group conversations (unreads sorted to top)
  const sortByUnread = (a: Conversation, b: Conversation) =>
    (b.has_unreads ? 1 : 0) - (a.has_unreads ? 1 : 0);
  const channels = conversations.filter((c) => c.is_channel).sort(sortByUnread);
  const dms = conversations.filter((c) => c.is_im).sort(sortByUnread);
  const groupDms = conversations.filter((c) => c.is_mpim).sort(sortByUnread);

  const showWorkspaceBadge = activeWorkspaceId === ALL_WORKSPACES && visibleWorkspaces.length > 1;

  // ─── Empty state ─────────────────────────────────────────

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">No Slack workspaces connected</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Go to Settings to connect your Slack workspaces and map them to clients.
          </p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/settings")}>
          Go to Settings
        </Button>
      </div>
    );
  }

  // ─── Conversation list item renderer ────────────────────
  function renderConversation(conv: Conversation) {
    const isActive = activeConversation?.id === conv.id && activeConversation?.workspaceId === conv.workspaceId;
    const hasUnread = conv.has_unreads && !isActive;
    return (
      <button
        key={`${conv.workspaceId}-${conv.id}`}
        onClick={() => fetchMessages(conv)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left ${
          isActive
            ? "bg-primary text-primary-foreground"
            : hasUnread
            ? "text-foreground hover:bg-accent hover:text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        {conv.is_channel ? (
          <Hash className={`h-3.5 w-3.5 shrink-0 ${hasUnread ? "text-foreground" : ""}`} />
        ) : conv.is_mpim ? (
          <Users className={`h-3.5 w-3.5 shrink-0 ${hasUnread ? "text-foreground" : ""}`} />
        ) : (
          <User className={`h-3.5 w-3.5 shrink-0 ${hasUnread ? "text-foreground" : ""}`} />
        )}
        <span className={`truncate flex-1 ${hasUnread ? "font-bold" : ""}`}>{conv.name}</span>
        {hasUnread && conv.unread_count > 0 && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0 min-w-[1.25rem] text-center shrink-0">
            {conv.unread_count}
          </Badge>
        )}
        {showWorkspaceBadge && (
          <span className="text-[9px] opacity-60 shrink-0">{conv.workspaceName}</span>
        )}
      </button>
    );
  }

  // ─── Main layout ─────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {/* Context indicator */}
          {context.client && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
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
          Focus mode: only showing messages from workspaces mapped to{" "}
          <strong>{context.client.name}</strong>.
          {visibleWorkspaces.length === 0 && (
            <span className="text-amber-600 ml-1">
              No workspaces mapped to this client. Map one in Settings or turn off Focus mode.
            </span>
          )}
        </p>
      )}
      {focusMode && !context.client && (
        <p className="text-xs text-muted-foreground">
          Focus mode is on, but no active timer or schedule block right now. Showing all workspaces.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Main content: sidebar + messages */}
      <div className="flex gap-3 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Conversation sidebar */}
        <Card className={`w-full md:w-64 shrink-0 flex-col ${activeConversation ? "hidden md:flex" : "flex"}`}>
          <div className="p-2 border-b flex items-center gap-2">
            {/* Workspace dropdown */}
            <Select
              value={activeWorkspaceId}
              onValueChange={setActiveWorkspaceId}
            >
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {visibleWorkspaces.length > 1 && (
                  <SelectItem value={ALL_WORKSPACES} className="text-xs">
                    All Workspaces ({visibleWorkspaces.length})
                  </SelectItem>
                )}
                {visibleWorkspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id} className="text-xs">
                    {ws.teamName}
                    {ws.client ? ` (${ws.client.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={fetchConversations}
            >
              <RefreshCw className={`h-3 w-3 ${loadingConvos ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-3">
              {loadingConvos && (
                <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
              )}

              {/* Channels */}
              {channels.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    Channels
                  </p>
                  {channels.map(renderConversation)}
                </div>
              )}

              {/* DMs */}
              {dms.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    Direct Messages
                  </p>
                  {dms.map(renderConversation)}
                </div>
              )}

              {/* Group DMs */}
              {groupDms.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    Group Messages
                  </p>
                  {groupDms.map(renderConversation)}
                </div>
              )}

              {!loadingConvos && conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No conversations found
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Message pane */}
        <Card className={`flex-1 flex-col min-w-0 ${activeConversation ? "flex" : "hidden md:flex"}`}>
          {/* Conversation header */}
          {activeConversation ? (
            <div className="p-3 border-b flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-7 w-7 p-0 shrink-0"
                onClick={() => { setActiveConversation(null); setMessages([]); }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {activeConversation.is_channel ? (
                <Hash className="h-4 w-4 text-muted-foreground" />
              ) : activeConversation.is_mpim ? (
                <Users className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium text-sm">{activeConversation.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal ml-auto">
                {activeConversation.workspaceName}
              </Badge>
            </div>
          ) : (
            <div className="p-3 border-b">
              <span className="text-sm text-muted-foreground">Select a conversation</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              {loadingMessages && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Loading messages...
                </p>
              )}

              {!loadingMessages && activeConversation && messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No messages in this conversation
                </p>
              )}

              {!activeConversation && !loadingMessages && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2" />
                  <p className="text-sm">Select a conversation to view messages</p>
                </div>
              )}

              {messages.map((msg, i) => {
                const showDate =
                  i === 0 || formatDate(msg.ts) !== formatDate(messages[i - 1].ts);
                return (
                  <div key={msg.ts}>
                    {showDate && (
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 border-t" />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatDate(msg.ts)}
                        </span>
                        <div className="flex-1 border-t" />
                      </div>
                    )}
                    <div className="group flex gap-2 py-1 px-2 rounded hover:bg-accent/50 transition-colors">
                      {/* User avatar placeholder */}
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                        {resolveUser(msg.user)
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{resolveUser(msg.user)}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(msg.ts)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input */}
          {activeConversation && (
            <CardContent className="p-3 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeConversation.is_channel ? "#" : ""}${activeConversation.name}`}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!messageInput.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
