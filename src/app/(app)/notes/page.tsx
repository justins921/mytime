"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  ArrowLeft,
  Search,
} from "lucide-react";

interface ClientInfo {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  clientId: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  client: ClientInfo | null;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchNotes();
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []));
  }, [fetchNotes]);

  const selectedNote = notes.find((n) => n.id === selectedId) || null;

  const filteredNotes = notes.filter((n) => {
    if (filterClient !== "all" && n.clientId !== filterClient) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: "" }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
    }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function togglePin(note: Note) {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
      );
    }
  }

  function saveNote(id: string, field: "title" | "content" | "clientId", value: string | null) {
    // Optimistic local update
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, [field]: value, updatedAt: new Date().toISOString() };
        if (field === "clientId") {
          updated.client = value ? clients.find((c) => c.id === value) || null : null;
        }
        return updated;
      })
    );

    // Debounced save
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      setSaving(false);
    }, 500);
    setSaveTimeout(timeout);
  }

  function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Notes sidebar list */}
      <Card className={`w-full md:w-80 shrink-0 flex-col overflow-hidden ${selectedNote ? "hidden md:flex" : "flex"}`}>
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              <h2 className="font-semibold text-sm">Notes</h2>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {filteredNotes.length}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createNote}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All clients</SelectItem>
              <SelectItem value="none" className="text-xs">No client</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No notes yet. Click + to create one.
            </p>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={`w-full text-left px-3 py-2.5 border-b hover:bg-accent/50 transition-colors ${
                selectedId === note.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                {note.pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
                <span className="font-medium text-sm truncate flex-1">
                  {note.title || "Untitled"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeDate(note.updatedAt)}
                </span>
                {note.client && (
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: note.client.color }}
                    />
                    <span className="text-[10px] text-muted-foreground truncate">
                      {note.client.name}
                    </span>
                  </span>
                )}
              </div>
              {note.content && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {note.content.slice(0, 120)}
                </p>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Note editor */}
      <Card className={`flex-1 flex flex-col overflow-hidden ${selectedNote ? "flex" : "hidden md:flex"}`}>
        {selectedNote ? (
          <>
            <div className="p-3 border-b flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:hidden"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <Select
                  value={selectedNote.clientId || "none"}
                  onValueChange={(v) => saveNote(selectedNote.id, "clientId", v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder="No client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {saving && (
                  <span className="text-[10px] text-muted-foreground">Saving...</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => togglePin(selectedNote)}
                title={selectedNote.pinned ? "Unpin" : "Pin"}
              >
                <Pin className={`h-3.5 w-3.5 ${selectedNote.pinned ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteNote(selectedNote.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto p-4">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => saveNote(selectedNote.id, "title", e.target.value)}
                placeholder="Note title..."
                className="text-xl font-semibold bg-transparent border-none outline-none w-full mb-3"
              />
              <textarea
                value={selectedNote.content}
                onChange={(e) => saveNote(selectedNote.id, "content", e.target.value)}
                placeholder="Start writing..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed w-full min-h-[200px]"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a note or create a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
