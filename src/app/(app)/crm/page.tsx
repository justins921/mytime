"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Search,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Globe,
  Building2,
  DollarSign,
  Trash2,
  Plus,
  X,
  ArrowLeft,
  Send,
  MessageSquare,
  Calendar,
  FileText,
  PhoneCall,
  Video,
  StickyNote,
  Clock,
  ExternalLink,
  ScrollText,
  Download,
  Copy,
  Check as CheckIcon,
  Pencil,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  stage: string;
  source: string;
  estimatedValue: number;
  notes: string;
  linkedClientId: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activities: { id: string; type: string; title: string; date: string }[];
  _count: { activities: number };
};

type ContractTemplate = {
  id: string;
  name: string;
  isDefault: boolean;
};

type Contract = {
  id: string;
  name: string;
  content: string;
  status: string;
  templateId: string | null;
  createdAt: string;
  template: { id: string; name: string } | null;
};

// ─── Constants ─────────────────────────────────────

const STAGES = [
  { value: "lead", label: "Lead", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "meeting", label: "Meeting", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "proposal", label: "Proposal", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "won", label: "Won", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-700 border-red-200" },
];

const SOURCES = [
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const ACTIVITY_TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "call", label: "Call", icon: PhoneCall },
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "note", label: "Note", icon: StickyNote },
  { value: "follow_up", label: "Follow-up", icon: Calendar },
  { value: "proposal", label: "Proposal", icon: FileText },
];

const STAGE_COLORS: Record<string, string> = {};
for (const s of STAGES) STAGE_COLORS[s.value] = s.color;

// ─── Component ─────────────────────────────────────

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"pipeline" | "list">("pipeline");

  // Detail panel
  const [selected, setSelected] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // New contact form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    website: "",
    stage: "lead",
    source: "other",
    estimatedValue: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Activity form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [actForm, setActForm] = useState({
    type: "email",
    title: "",
    description: "",
  });

  // Inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Contracts
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showContractGen, setShowContractGen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [contractOverrides, setContractOverrides] = useState<Record<string, string>>({});
  const [generatingContract, setGeneratingContract] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [editingContractContent, setEditingContractContent] = useState("");
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const data = await fetch("/api/crm").then((r) => r.json());
      if (Array.isArray(data)) setContacts(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  async function loadActivities(contactId: string) {
    setLoadingActivities(true);
    try {
      const data = await fetch(`/api/crm/activities?contactId=${contactId}`).then((r) => r.json());
      if (Array.isArray(data)) setActivities(data);
    } catch {
      // ignore
    }
    setLoadingActivities(false);
  }

  function selectContact(contact: Contact) {
    setSelected(contact);
    setShowActivityForm(false);
    setShowContractGen(false);
    setViewingContract(null);
    loadActivities(contact.id);
    loadContracts(contact.id);
  }

  async function createContact() {
    if (!newForm.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          estimatedValue: parseFloat(newForm.estimatedValue) || 0,
        }),
      });
      if (res.ok) {
        const contact = await res.json();
        setContacts([contact, ...contacts]);
        setShowNewForm(false);
        setNewForm({ name: "", email: "", phone: "", company: "", website: "", stage: "lead", source: "other", estimatedValue: "", notes: "" });
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  async function updateContact(id: string, updates: Record<string, unknown>) {
    const res = await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContacts(contacts.map((c) => (c.id === id ? updated : c)));
      if (selected?.id === id) setSelected(updated);
    }
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact and all their activities?")) return;
    const res = await fetch("/api/crm", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setContacts(contacts.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  }

  async function logActivity() {
    if (!selected || !actForm.title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selected.id, ...actForm }),
      });
      if (res.ok) {
        const activity = await res.json();
        setActivities([activity, ...activities]);
        setShowActivityForm(false);
        setActForm({ type: "email", title: "", description: "" });
        // Refresh contact to get updated lastContactedAt
        await loadContacts();
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  async function deleteActivity(actId: string) {
    const res = await fetch("/api/crm/activities", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: actId }),
    });
    if (res.ok) {
      setActivities(activities.filter((a) => a.id !== actId));
    }
  }

  function startInlineEdit(field: string, value: string) {
    setEditingField(field);
    setEditValue(value);
  }

  async function saveInlineEdit(field: string) {
    if (!selected) return;
    const val = field === "estimatedValue" ? parseFloat(editValue) || 0 : editValue;
    await updateContact(selected.id, { [field]: val });
    setEditingField(null);
  }

  // ─── Contract functions ──────────────────────────
  async function loadTemplates() {
    try {
      const data = await fetch("/api/crm/contract-templates").then((r) => r.json());
      if (Array.isArray(data)) {
        setTemplates(data);
        if (data.length > 0 && !selectedTemplate) setSelectedTemplate(data[0].id);
      }
    } catch { /* ignore */ }
  }

  async function loadContracts(contactId: string) {
    try {
      const data = await fetch(`/api/crm/contracts?contactId=${contactId}`).then((r) => r.json());
      if (Array.isArray(data)) setContracts(data);
    } catch { /* ignore */ }
  }

  function openContractGenerator() {
    loadTemplates();
    setContractOverrides({});
    setShowContractGen(true);
  }

  async function generateContract() {
    if (!selected || !selectedTemplate) return;
    setGeneratingContract(true);
    try {
      const res = await fetch("/api/crm/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selected.id,
          templateId: selectedTemplate,
          overrides: contractOverrides,
        }),
      });
      if (res.ok) {
        const contract = await res.json();
        setContracts([contract, ...contracts]);
        setShowContractGen(false);
        setViewingContract(contract);
        setEditingContractContent(contract.content);
      }
    } catch { /* ignore */ }
    setGeneratingContract(false);
  }

  async function updateContractStatus(contractId: string, status: string) {
    const res = await fetch("/api/crm/contracts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContracts(contracts.map((c) => (c.id === contractId ? updated : c)));
      if (viewingContract?.id === contractId) setViewingContract(updated);
    }
  }

  async function saveContractContent() {
    if (!viewingContract) return;
    const res = await fetch("/api/crm/contracts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: viewingContract.id, content: editingContractContent }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContracts(contracts.map((c) => (c.id === updated.id ? updated : c)));
      setViewingContract(updated);
      setIsEditingContract(false);
    }
  }

  async function deleteContract(contractId: string) {
    const res = await fetch("/api/crm/contracts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId }),
    });
    if (res.ok) {
      setContracts(contracts.filter((c) => c.id !== contractId));
      if (viewingContract?.id === contractId) setViewingContract(null);
    }
  }

  function copyContractToClipboard() {
    if (!viewingContract) return;
    navigator.clipboard.writeText(viewingContract.content);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  }

  // Filter contacts
  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  });

  // Group by stage for pipeline
  const pipeline: Record<string, Contact[]> = {};
  for (const s of STAGES) pipeline[s.value] = [];
  for (const c of filtered) {
    if (pipeline[c.stage]) pipeline[c.stage].push(c);
    else pipeline.lead.push(c);
  }

  // Pipeline stats
  const totalValue = contacts.filter((c) => c.stage !== "lost").reduce((sum, c) => sum + c.estimatedValue, 0);
  const wonValue = contacts.filter((c) => c.stage === "won").reduce((sum, c) => sum + c.estimatedValue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading CRM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contacts.length} contacts &middot; ${totalValue.toLocaleString()} pipeline &middot; ${wonValue.toLocaleString()} won
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="h-9 pl-9 pr-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary w-48"
            />
          </div>
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView("pipeline")}
              className={`px-3 py-1.5 text-xs font-medium ${view === "pipeline" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs font-medium border-l ${view === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* New Contact Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-md p-5 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">New Contact</h3>
              <button onClick={() => setShowNewForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium">Name *</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Smith"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Email</label>
                <input
                  type="email"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Phone</label>
                <input
                  type="tel"
                  value={newForm.phone}
                  onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Company</label>
                <input
                  type="text"
                  value={newForm.company}
                  onChange={(e) => setNewForm({ ...newForm, company: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Website</label>
                <input
                  type="url"
                  value={newForm.website}
                  onChange={(e) => setNewForm({ ...newForm, website: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://acme.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Stage</label>
                <select
                  value={newForm.stage}
                  onChange={(e) => setNewForm({ ...newForm, stage: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Source</label>
                <select
                  value={newForm.source}
                  onChange={(e) => setNewForm({ ...newForm, source: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Est. Value ($)</label>
                <input
                  type="number"
                  value={newForm.estimatedValue}
                  onChange={(e) => setNewForm({ ...newForm, estimatedValue: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5000"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Notes</label>
                <input
                  type="text"
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Met at conference..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewForm(false)} className="px-3 py-2 text-sm rounded-md border hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={createContact}
                disabled={saving || !newForm.name}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* Left: Pipeline or List */}
        <div className={`flex-1 min-w-0 ${selected ? "hidden md:block md:flex-1" : ""}`}>
          {/* Pipeline view */}
          {view === "pipeline" && (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageContacts = pipeline[stage.value];
                const stageValue = stageContacts.reduce((sum, c) => sum + c.estimatedValue, 0);
                return (
                  <div key={stage.value} className="flex-shrink-0 w-56">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stage.color}`}>
                          {stage.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{stageContacts.length}</span>
                      </div>
                      {stageValue > 0 && (
                        <span className="text-[10px] text-muted-foreground">${stageValue.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {stageContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => selectContact(contact)}
                          className={`w-full text-left rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors ${
                            selected?.id === contact.id ? "border-primary ring-1 ring-primary" : ""
                          }`}
                        >
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          {contact.company && (
                            <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                          )}
                          <div className="flex items-center justify-between mt-1.5">
                            {contact.estimatedValue > 0 ? (
                              <span className="text-xs font-medium text-emerald-600">
                                ${contact.estimatedValue.toLocaleString()}
                              </span>
                            ) : (
                              <span />
                            )}
                            {contact.lastContactedAt ? (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(contact.lastContactedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/50">No contact</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {stageContacts.length === 0 && (
                        <div className="rounded-lg border border-dashed p-3 text-center">
                          <p className="text-[10px] text-muted-foreground">No contacts</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List view */}
          {view === "list" && (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2.5 font-medium">Name</th>
                      <th className="text-left px-4 py-2.5 font-medium">Company</th>
                      <th className="text-left px-4 py-2.5 font-medium">Stage</th>
                      <th className="text-left px-4 py-2.5 font-medium">Source</th>
                      <th className="text-right px-4 py-2.5 font-medium">Value</th>
                      <th className="text-left px-4 py-2.5 font-medium">Last Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((c) => {
                      const stageInfo = STAGES.find((s) => s.value === c.stage);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => selectContact(c)}
                          className={`hover:bg-muted/30 cursor-pointer ${selected?.id === c.id ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-4 py-2.5">
                            <p className="font-medium">{c.name}</p>
                            {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{c.company || "\u2014"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stageInfo?.color || STAGE_COLORS.lead}`}>
                              {stageInfo?.label || c.stage}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">
                            {c.source.replace("_", " ")}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {c.estimatedValue > 0 ? `$${c.estimatedValue.toLocaleString()}` : "\u2014"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {c.lastContactedAt
                              ? new Date(c.lastContactedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                              : "\u2014"}
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          {search ? "No contacts match your search." : "No contacts yet. Add your first one!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Contact Detail */}
        {selected && (
          <div className={`${selected ? "w-full md:w-96 md:flex-shrink-0" : "hidden"}`}>
            <div className="rounded-lg border bg-card h-full overflow-y-auto">
              {/* Detail header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="md:hidden text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    <select
                      value={selected.stage}
                      onChange={(e) => updateContact(selected.id, { stage: e.target.value })}
                      className="text-xs border rounded px-2 py-1 bg-background font-medium"
                    >
                      {STAGES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteContact(selected.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name */}
                {editingField === "name" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveInlineEdit("name")}
                    onKeyDown={(e) => e.key === "Enter" && saveInlineEdit("name")}
                    className="text-lg font-bold w-full border-b border-primary focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h2
                    className="text-lg font-bold cursor-pointer hover:text-primary"
                    onClick={() => startInlineEdit("name", selected.name)}
                  >
                    {selected.name}
                  </h2>
                )}

                {/* Company */}
                {editingField === "company" ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveInlineEdit("company")}
                    onKeyDown={(e) => e.key === "Enter" && saveInlineEdit("company")}
                    className="text-sm text-muted-foreground w-full border-b border-primary focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => startInlineEdit("company", selected.company)}
                  >
                    {selected.company || "Add company..."}
                  </p>
                )}
              </div>

              {/* Contact info */}
              <div className="p-4 border-b space-y-2">
                <DetailRow icon={Mail} label="Email" value={selected.email} field="email" editingField={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startInlineEdit} onSave={saveInlineEdit} />
                <DetailRow icon={Phone} label="Phone" value={selected.phone} field="phone" editingField={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startInlineEdit} onSave={saveInlineEdit} />
                <DetailRow icon={Globe} label="Website" value={selected.website} field="website" editingField={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startInlineEdit} onSave={saveInlineEdit} isLink />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {editingField === "estimatedValue" ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveInlineEdit("estimatedValue")}
                      onKeyDown={(e) => e.key === "Enter" && saveInlineEdit("estimatedValue")}
                      className="text-sm w-full border-b border-primary focus:outline-none bg-transparent"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-sm cursor-pointer hover:text-primary"
                      onClick={() => startInlineEdit("estimatedValue", String(selected.estimatedValue))}
                    >
                      {selected.estimatedValue > 0 ? `$${selected.estimatedValue.toLocaleString()}` : "Add value..."}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <select
                    value={selected.source}
                    onChange={(e) => updateContact(selected.id, { source: e.target.value })}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="p-4 border-b">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                {editingField === "notes" ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveInlineEdit("notes")}
                    rows={3}
                    className="w-full text-sm mt-1 px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm mt-1 cursor-pointer hover:text-primary whitespace-pre-wrap"
                    onClick={() => startInlineEdit("notes", selected.notes)}
                  >
                    {selected.notes || "Click to add notes..."}
                  </p>
                )}
              </div>

              {/* Contracts */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contracts</h3>
                  <button
                    onClick={openContractGenerator}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                  >
                    <ScrollText className="h-3 w-3" />
                    Generate
                  </button>
                </div>
                {contracts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No contracts yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {contracts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setViewingContract(c); setEditingContractContent(c.content); setIsEditingContract(false); }}
                        className="w-full text-left p-2 rounded-md border hover:border-primary/40 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium truncate">{c.name}</p>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            c.status === "signed" ? "bg-emerald-100 text-emerald-700" :
                            c.status === "sent" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          {c.template && ` · ${c.template.name}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity log */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity</h3>
                  <button
                    onClick={() => setShowActivityForm(!showActivityForm)}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    Log Activity
                  </button>
                </div>

                {/* Activity form */}
                {showActivityForm && (
                  <div className="mb-3 p-3 rounded-md border bg-muted/30 space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {ACTIVITY_TYPES.map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.value}
                            onClick={() => setActForm({ ...actForm, type: t.value })}
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                              actForm.type === t.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={actForm.title}
                      onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                      placeholder="Activity title..."
                      className="w-full h-8 px-2 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <textarea
                      value={actForm.description}
                      onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                      placeholder="Details (optional)..."
                      rows={2}
                      className="w-full px-2 py-1 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowActivityForm(false)} className="text-xs text-muted-foreground">
                        Cancel
                      </button>
                      <button
                        onClick={logActivity}
                        disabled={saving || !actForm.title}
                        className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        {saving ? "Saving..." : "Log"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Activity timeline */}
                {loadingActivities ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
                ) : activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No activities yet.</p>
                ) : (
                  <div className="space-y-0">
                    {activities.map((act, i) => {
                      const typeInfo = ACTIVITY_TYPES.find((t) => t.value === act.type);
                      const Icon = typeInfo?.icon || MessageSquare;
                      return (
                        <div key={act.id} className="flex gap-3 group">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            {i < activities.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                          </div>
                          <div className="flex-1 pb-3 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{act.title}</p>
                              <button
                                onClick={() => deleteActivity(act.id)}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-all shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            {act.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{act.description}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(act.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Contract Generator Modal ─── */}
      {showContractGen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-md p-5 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Generate Contract</h3>
              <button onClick={() => setShowContractGen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a template and fill in any details. Contact info and linked client
              rates will be merged automatically.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Scope of Work</label>
                <textarea
                  value={contractOverrides.scope_of_work || ""}
                  onChange={(e) => setContractOverrides({ ...contractOverrides, scope_of_work: e.target.value })}
                  placeholder="Describe the work to be performed..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Date</label>
                  <input
                    type="date"
                    value={contractOverrides.start_date || ""}
                    onChange={(e) => setContractOverrides({ ...contractOverrides, start_date: e.target.value })}
                    className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Date</label>
                  <input
                    type="date"
                    value={contractOverrides.end_date || ""}
                    onChange={(e) => setContractOverrides({ ...contractOverrides, end_date: e.target.value })}
                    className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Hourly Rate Override</label>
                  <input
                    type="text"
                    value={contractOverrides.hourly_rate || ""}
                    onChange={(e) => setContractOverrides({ ...contractOverrides, hourly_rate: e.target.value })}
                    placeholder="Auto from client"
                    className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Project Fee</label>
                  <input
                    type="text"
                    value={contractOverrides.project_fee || ""}
                    onChange={(e) => setContractOverrides({ ...contractOverrides, project_fee: e.target.value })}
                    placeholder="For fixed-price"
                    className="w-full h-9 px-3 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowContractGen(false)} className="px-3 py-2 text-sm rounded-md border hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={generateContract}
                disabled={generatingContract || !selectedTemplate}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <ScrollText className="h-4 w-4" />
                {generatingContract ? "Generating..." : "Generate Contract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Contract Viewer/Editor Modal ─── */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-3xl m-4 flex flex-col" style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{viewingContract.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    viewingContract.status === "signed" ? "bg-emerald-100 text-emerald-700" :
                    viewingContract.status === "sent" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {viewingContract.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(viewingContract.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingContract(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditingContract ? (
                <textarea
                  value={editingContractContent}
                  onChange={(e) => setEditingContractContent(e.target.value)}
                  className="w-full h-full min-h-[400px] px-3 py-2 text-sm font-mono rounded-md border focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {viewingContract.content.split("\n").map((line, i) => {
                    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4 mb-1">{line.slice(3)}</h2>;
                    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                    if (line.startsWith("---")) return <hr key={i} className="my-4" />;
                    if (line.startsWith("- ")) return <li key={i} className="text-sm ml-4">{renderInline(line.slice(2))}</li>;
                    if (line.startsWith("| ")) return <p key={i} className="text-sm font-mono">{line}</p>;
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>;
                  })}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between p-4 border-t shrink-0 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {viewingContract.status === "draft" && (
                  <button
                    onClick={() => updateContractStatus(viewingContract.id, "sent")}
                    className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-blue-700"
                  >
                    <Send className="h-3 w-3" />
                    Mark Sent
                  </button>
                )}
                {(viewingContract.status === "draft" || viewingContract.status === "sent") && (
                  <button
                    onClick={() => updateContractStatus(viewingContract.id, "signed")}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-emerald-700"
                  >
                    <CheckIcon className="h-3 w-3" />
                    Mark Signed
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteContract(viewingContract.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                  title="Delete contract"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={copyContractToClipboard}
                  className="inline-flex items-center gap-1 text-xs border px-3 py-1.5 rounded-md font-medium hover:bg-muted"
                >
                  {copiedContract ? <CheckIcon className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedContract ? "Copied" : "Copy"}
                </button>
                {isEditingContract ? (
                  <button
                    onClick={saveContractContent}
                    className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90"
                  >
                    <CheckIcon className="h-3 w-3" />
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsEditingContract(true); setEditingContractContent(viewingContract.content); }}
                    className="inline-flex items-center gap-1 text-xs border px-3 py-1.5 rounded-md font-medium hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────

/** Simple inline Markdown rendering for bold text */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Highlight unresolved merge fields
    if (part.includes("{{")) {
      const segments = part.split(/(\{\{[^}]+\}\})/g);
      return segments.map((seg, j) => {
        if (seg.startsWith("{{") && seg.endsWith("}}")) {
          return (
            <span key={`${i}-${j}`} className="px-1 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-mono">
              {seg}
            </span>
          );
        }
        return seg;
      });
    }
    return part;
  });
}

// ─── Detail Row Component ─────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  field,
  editingField,
  editValue,
  setEditValue,
  onStartEdit,
  onSave,
  isLink,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  field: string;
  editingField: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onStartEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {editingField === field ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onSave(field)}
          onKeyDown={(e) => e.key === "Enter" && onSave(field)}
          className="text-sm w-full border-b border-primary focus:outline-none bg-transparent"
          autoFocus
        />
      ) : value ? (
        <div className="flex items-center gap-1 min-w-0">
          <span
            className="text-sm truncate cursor-pointer hover:text-primary"
            onClick={() => onStartEdit(field, value)}
          >
            {value}
          </span>
          {isLink && value && (
            <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
            </a>
          )}
        </div>
      ) : (
        <span
          className="text-sm text-muted-foreground/50 cursor-pointer hover:text-muted-foreground"
          onClick={() => onStartEdit(field, "")}
        >
          Add {label.toLowerCase()}...
        </span>
      )}
    </div>
  );
}
