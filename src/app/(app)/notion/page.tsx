"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Star,
  StarOff,
  Plus,
  ExternalLink,
  Search,
  ArrowLeft,
  Loader2,
  Key,
} from "lucide-react";

interface NotionWorkspace {
  id: string;
  workspaceId: string;
  workspaceName: string;
  icon: string;
  favoritePages: NotionFavorite[];
}

interface NotionFavorite {
  id: string;
  pageId: string;
  title: string;
  icon: string;
  workspaceId: string;
  workspace?: { id: string; workspaceName: string };
}

interface NotionPageResult {
  id: string;
  title: string;
  icon: string;
  url: string;
  lastEditedTime: string;
  parentType: string;
}

interface PageContent {
  id: string;
  title: string;
  url: string;
  content: string;
  icon: unknown;
}

export default function NotionPage() {
  const [workspaces, setWorkspaces] = useState<NotionWorkspace[]>([]);
  const [favorites, setFavorites] = useState<NotionFavorite[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NotionPageResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewingPage, setViewingPage] = useState<PageContent | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [newName, setNewName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const fetchWorkspaces = useCallback(async () => {
    const res = await fetch("/api/notion/workspaces");
    const data = await res.json();
    setWorkspaces(Array.isArray(data) ? data : []);
    if (data.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(data[0].id);
    }
  }, [selectedWorkspace]);

  const fetchFavorites = useCallback(async () => {
    const res = await fetch("/api/notion/favorites");
    const data = await res.json();
    setFavorites(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchWorkspaces();
    fetchFavorites();
  }, [fetchWorkspaces, fetchFavorites]);

  async function connectWorkspace() {
    if (!newToken.trim()) return;
    setConnecting(true);
    setConnectError("");
    const res = await fetch("/api/notion/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: newToken.trim(), name: newName.trim() || undefined }),
    });
    if (res.ok) {
      setNewToken("");
      setNewName("");
      fetchWorkspaces();
    } else {
      const data = await res.json();
      setConnectError(data.error || "Failed to connect");
    }
    setConnecting(false);
  }

  async function searchPages() {
    if (!selectedWorkspace) return;
    setSearching(true);
    const params = new URLSearchParams({
      workspaceId: selectedWorkspace,
      query: searchQuery,
    });
    const res = await fetch(`/api/notion/search?${params}`);
    const data = await res.json();
    setSearchResults(data.pages || []);
    setSearching(false);
  }

  async function loadPage(pageId: string, workspaceId: string) {
    setLoadingPage(true);
    const params = new URLSearchParams({ pageId, workspaceId });
    const res = await fetch(`/api/notion/pages?${params}`);
    if (res.ok) {
      const data = await res.json();
      setViewingPage(data);
    }
    setLoadingPage(false);
  }

  async function addFavorite(page: NotionPageResult) {
    if (!selectedWorkspace) return;
    const res = await fetch("/api/notion/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: page.id,
        title: page.title,
        icon: page.icon,
        workspaceId: selectedWorkspace,
      }),
    });
    if (res.ok) {
      fetchFavorites();
      fetchWorkspaces();
    }
  }

  async function removeFavorite(id: string) {
    await fetch(`/api/notion/favorites/${id}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    fetchWorkspaces();
  }

  async function disconnectWorkspace(id: string) {
    await fetch("/api/notion/workspaces", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (selectedWorkspace === id) setSelectedWorkspace("");
    fetchFavorites();
  }

  function isFavorited(pageId: string) {
    return favorites.some((f) => f.pageId === pageId);
  }

  function getFavoriteId(pageId: string) {
    return favorites.find((f) => f.pageId === pageId)?.id;
  }

  // Viewing a page — full content view
  if (viewingPage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setViewingPage(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold flex-1 truncate">{viewingPage.title}</h2>
          <a
            href={viewingPage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <Card>
          <CardContent className="pt-6">
            {viewingPage.content ? (
              <div className="notion-content text-sm leading-relaxed max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {viewingPage.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">This page has no content blocks.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Notion</h2>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Connect Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Notion Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">How to connect:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <strong>notion.so/my-integrations</strong></li>
                  <li>Click <strong>New integration</strong></li>
                  <li>Select the workspace, give it a name (e.g. "MyTime")</li>
                  <li>Choose <strong>Internal</strong> type and submit</li>
                  <li>Copy the <strong>Internal Integration Secret</strong></li>
                  <li>In Notion, open each page you want to access, click <strong>...</strong> &rarr; <strong>Connect to</strong> &rarr; select your integration</li>
                </ol>
              </div>
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Work, Personal"
                />
              </div>
              <div className="space-y-2">
                <Label>Integration Token</Label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={newToken}
                    onChange={(e) => { setNewToken(e.target.value); setConnectError(""); }}
                    placeholder="ntn_..."
                    className="pl-8"
                  />
                </div>
              </div>
              {connectError && (
                <p className="text-xs text-destructive">{connectError}</p>
              )}
              <DialogClose asChild>
                <Button
                  onClick={connectWorkspace}
                  disabled={connecting || !newToken.trim()}
                  className="w-full"
                >
                  {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {connecting ? "Connecting..." : "Connect"}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected workspaces */}
      {workspaces.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Connected Workspaces</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {ws.icon ? (
                      <span className="text-lg">{ws.icon}</span>
                    ) : (
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{ws.workspaceName}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {ws.favoritePages.length} favorite{ws.favoritePages.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={() => disconnectWorkspace(ws.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {workspaces.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No Notion workspaces connected yet.</p>
              <p className="text-xs mt-1">Click "Connect Workspace" to add an integration token.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorite pages — quick access */}
      {favorites.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Favorite Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => loadPage(fav.pageId, fav.workspaceId)}
                  className="flex items-center gap-2 p-3 border rounded-md hover:bg-accent/50 text-left transition-colors"
                >
                  <span className="text-lg shrink-0">{fav.icon || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{fav.title}</span>
                    {fav.workspace && (
                      <span className="text-[10px] text-muted-foreground">
                        {fav.workspace.workspaceName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(fav.id);
                    }}
                    className="text-yellow-500 hover:text-yellow-600 shrink-0"
                  >
                    <StarOff className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Browse / Search pages */}
      {workspaces.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Browse Pages</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setShowBrowse(!showBrowse);
                  if (!showBrowse && searchResults.length === 0) searchPages();
                }}
              >
                {showBrowse ? "Hide" : "Show"}
              </Button>
            </CardTitle>
          </CardHeader>
          {showBrowse && (
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="flex gap-2">
                {workspaces.length > 1 && (
                  <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                    <SelectTrigger className="h-8 w-48 text-xs">
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((ws) => (
                        <SelectItem key={ws.id} value={ws.id} className="text-xs">
                          {ws.workspaceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchPages()}
                      className="h-8 text-xs pl-7"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={searchPages}
                    disabled={searching}
                  >
                    {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>

              {searchResults.length === 0 && !searching && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Search for pages or browse your workspace. Make sure pages are shared with your integration in Notion.
                </p>
              )}

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {searchResults.map((page) => {
                  const favorited = isFavorited(page.id);
                  return (
                    <div
                      key={page.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-base shrink-0">{page.icon || "📄"}</span>
                      <button
                        onClick={() => loadPage(page.id, selectedWorkspace)}
                        className="flex-1 text-left min-w-0"
                      >
                        <span className="text-sm font-medium block truncate">{page.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(page.lastEditedTime).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          favorited
                            ? removeFavorite(getFavoriteId(page.id)!)
                            : addFavorite(page)
                        }
                        className={`shrink-0 ${favorited ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                        title={favorited ? "Remove favorite" : "Add to favorites"}
                      >
                        {favorited ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>

              {loadingPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
