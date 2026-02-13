"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, Camera, Send, X, Check, ExternalLink, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import html2canvas from "html2canvas";

interface DevNote {
  id: string;
  content: string;
  pageUrl: string | null;
  screenshot: string | null;
  status: string;
  githubIssueUrl: string | null;
  createdAt: string;
}

export function DevNotesButton() {
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"compose" | "list">("compose");
  const [content, setContent] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [notes, setNotes] = useState<DevNote[]>([]);
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/stripe/plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "owner") setIsOwner(true);
      })
      .catch(() => {});
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/dev-notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isOwner && open) loadNotes();
  }, [isOwner, open, loadNotes]);

  if (!isOwner) return null;

  async function captureScreenshot() {
    setCapturing(true);
    try {
      // Temporarily hide the popover for the capture
      const popoverEl = document.querySelector("[data-radix-popper-content-wrapper]") as HTMLElement;
      if (popoverEl) popoverEl.style.display = "none";

      const canvas = await html2canvas(document.body, {
        scale: 0.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      if (popoverEl) popoverEl.style.display = "";

      const dataUrl = canvas.toDataURL("image/png", 0.6);
      setScreenshot(dataUrl);
    } catch {
      setMessage("Screenshot capture failed");
    }
    setCapturing(false);
  }

  async function saveNote() {
    if (!content.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/dev-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          pageUrl: window.location.pathname,
          screenshot,
        }),
      });
      if (res.ok) {
        setContent("");
        setScreenshot(null);
        setMessage("Saved!");
        loadNotes();
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setMessage("Failed to save");
    }
    setSaving(false);
  }

  async function saveAndSend() {
    if (!content.trim()) return;
    setSending(true);
    setMessage("");
    try {
      // First save the note
      const saveRes = await fetch("/api/dev-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          pageUrl: window.location.pathname,
          screenshot,
        }),
      });
      if (!saveRes.ok) { setMessage("Failed to save"); setSending(false); return; }
      const note = await saveRes.json();

      // Then send to GitHub
      const sendRes = await fetch("/api/dev-notes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id }),
      });
      const sendData = await sendRes.json();
      if (sendRes.ok) {
        setContent("");
        setScreenshot(null);
        setMessage("Sent to GitHub!");
        loadNotes();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(sendData.error || "Failed to send");
        loadNotes();
      }
    } catch {
      setMessage("Failed to send");
    }
    setSending(false);
  }

  async function deleteNote(id: string) {
    await fetch("/api/dev-notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  async function sendExistingNote(id: string) {
    setSending(true);
    const res = await fetch("/api/dev-notes/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Sent!");
      loadNotes();
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage(data.error || "Failed to send");
    }
    setSending(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center h-8 w-8 rounded-md border hover:bg-accent transition-colors"
          title="Dev Notes"
        >
          <Pencil className="h-3.5 w-3.5" />
          {notes.filter((n) => n.status === "draft").length > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 text-[8px] text-white flex items-center justify-center font-bold">
              {notes.filter((n) => n.status === "draft").length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setView("compose")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              view === "compose" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            New Note
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              view === "list" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History ({notes.length})
          </button>
        </div>

        {view === "compose" && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="font-mono">{typeof window !== "undefined" ? window.location.pathname : ""}</span>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What needs to change here..."
              className="w-full h-24 text-sm border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-background"
            />

            {/* Screenshot preview */}
            {screenshot && (
              <div className="relative">
                <img src={screenshot} alt="Screenshot" className="w-full rounded-md border" />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={captureScreenshot}
                disabled={capturing}
              >
                <Camera className="h-3 w-3 mr-1" />
                {capturing ? "Capturing..." : "Screenshot"}
              </Button>

              <div className="flex-1" />

              {message && (
                <span className={`text-[10px] ${message.includes("fail") || message.includes("Failed") || message.includes("error") ? "text-red-500" : "text-green-500"}`}>
                  {message}
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={saveNote}
                disabled={!content.trim() || saving}
              >
                <Check className="h-3 w-3 mr-1" />
                {saving ? "..." : "Save"}
              </Button>

              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={saveAndSend}
                disabled={!content.trim() || sending}
              >
                <Send className="h-3 w-3 mr-1" />
                {sending ? "Sending..." : "Send to Claude"}
              </Button>
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="max-h-80 overflow-y-auto">
            {notes.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">No dev notes yet</div>
            )}
            {notes.map((note) => (
              <div key={note.id} className="p-3 border-b last:border-b-0 hover:bg-muted/30">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs line-clamp-2">{note.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                      {note.pageUrl && (
                        <span className="text-[10px] text-muted-foreground font-mono">{note.pageUrl}</span>
                      )}
                      {note.status === "sent" && (
                        <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" />Sent
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.screenshot && (
                      <details className="relative">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          <Camera className="h-3 w-3" />
                        </summary>
                        <div className="absolute right-0 top-5 z-50 w-72 rounded-md border bg-background shadow-lg p-1">
                          <img src={note.screenshot} alt="Screenshot" className="w-full rounded" />
                        </div>
                      </details>
                    )}
                    {note.githubIssueUrl && (
                      <a href={note.githubIssueUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {note.status === "draft" && (
                      <button onClick={() => sendExistingNote(note.id)} disabled={sending} className="text-muted-foreground hover:text-primary" title="Send to Claude">
                        <Send className="h-3 w-3" />
                      </button>
                    )}
                    <button onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
