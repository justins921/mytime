"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

type ImpersonationState = {
  impersonating: boolean;
  user?: { id: string; name: string | null; email: string; plan: string; role: string };
  adminName?: string;
};

export function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    fetch("/api/admin/impersonate")
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState({ impersonating: false }));
  }, []);

  async function stopImpersonating() {
    setStopping(true);
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    window.location.href = "/admin";
  }

  if (!state?.impersonating || !state.user) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 text-amber-950 px-4 py-1.5 text-sm font-medium">
      <Eye className="h-4 w-4 shrink-0" />
      <span>
        Viewing as <strong>{state.user.name || state.user.email}</strong>
        <span className="hidden sm:inline"> ({state.user.email})</span>
        <span className="ml-1.5 text-[11px] font-normal opacity-75">
          — {state.user.plan} / {state.user.role}
        </span>
      </span>
      <button
        onClick={stopImpersonating}
        disabled={stopping}
        className="ml-2 inline-flex items-center gap-1 bg-amber-950/20 hover:bg-amber-950/30 text-amber-950 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
      >
        <X className="h-3 w-3" />
        {stopping ? "Stopping..." : "Stop"}
      </button>
    </div>
  );
}
