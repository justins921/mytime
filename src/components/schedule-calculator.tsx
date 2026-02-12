"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

/* ─── Free Tool: Freelance Schedule Calculator ───
   free-tool-strategy: Solves a real problem (how to allocate time across clients),
   adjacent to core product (natural path to signup), simple and focused.
   Lead capture: ungated with optional email for saved results.
─── */

type ClientInput = {
  id: number;
  name: string;
  hoursPerWeek: number;
  rate: number;
};

let nextId = 1;

export function ScheduleCalculator() {
  const [clients, setClients] = useState<ClientInput[]>([
    { id: nextId++, name: "Client A", hoursPerWeek: 15, rate: 100 },
    { id: nextId++, name: "Client B", hoursPerWeek: 10, rate: 125 },
  ]);
  const [availableHours, setAvailableHours] = useState(40);
  const [showResults, setShowResults] = useState(false);

  const addClient = () => {
    setClients([...clients, { id: nextId++, name: "", hoursPerWeek: 5, rate: 75 }]);
    setShowResults(false);
  };

  const removeClient = (id: number) => {
    setClients(clients.filter((c) => c.id !== id));
    setShowResults(false);
  };

  const updateClient = (id: number, field: keyof ClientInput, value: string | number) => {
    setClients(clients.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setShowResults(false);
  };

  const totalClientHours = clients.reduce((sum, c) => sum + c.hoursPerWeek, 0);
  const totalWeeklyRevenue = clients.reduce((sum, c) => sum + c.hoursPerWeek * c.rate, 0);
  const monthlyRevenue = totalWeeklyRevenue * 4.33;
  const utilization = availableHours > 0 ? (totalClientHours / availableHours) * 100 : 0;
  const freeHours = Math.max(0, availableHours - totalClientHours);
  const overbooked = totalClientHours > availableHours;

  // Per-client breakdown
  const breakdown = clients.map((c) => ({
    ...c,
    pctOfTime: availableHours > 0 ? (c.hoursPerWeek / availableHours) * 100 : 0,
    weeklyRevenue: c.hoursPerWeek * c.rate,
    monthlyRevenue: c.hoursPerWeek * c.rate * 4.33,
    dailyAvg: c.hoursPerWeek / 5,
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold">Freelance Schedule Calculator</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            See how your clients fit into your week — and what you&apos;re leaving on the table.
          </p>
        </div>

        <div className="p-6">
          {/* Available hours */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Available hours per week
            </label>
            <input
              type="number"
              value={availableHours}
              onChange={(e) => {
                setAvailableHours(Number(e.target.value));
                setShowResults(false);
              }}
              className="h-10 w-32 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              min={1}
              max={80}
            />
          </div>

          {/* Client rows */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Your clients</p>
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50/50"
                >
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => updateClient(client.id, "name", e.target.value)}
                    placeholder="Client name"
                    className="h-9 flex-1 min-w-0 px-3 rounded-md border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={client.hoursPerWeek}
                      onChange={(e) =>
                        updateClient(client.id, "hoursPerWeek", Number(e.target.value))
                      }
                      className="h-9 w-16 px-2 rounded-md border text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      min={0}
                      max={80}
                    />
                    <span className="text-xs text-gray-400 shrink-0">hrs/wk</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      value={client.rate}
                      onChange={(e) =>
                        updateClient(client.id, "rate", Number(e.target.value))
                      }
                      className="h-9 w-20 px-2 rounded-md border text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                      min={0}
                    />
                    <span className="text-xs text-gray-400 shrink-0">/hr</span>
                  </div>
                  {clients.length > 1 && (
                    <button
                      onClick={() => removeClient(client.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addClient}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add client
            </button>
          </div>

          {/* Calculate button */}
          <button
            onClick={() => setShowResults(true)}
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 py-2.5 rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            Calculate My Week
          </button>

          {/* Results */}
          {showResults && (
            <div className="mt-6 pt-6 border-t space-y-5" style={{ animation: "fadeIn 0.3s ease-out" }}>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <p className={`text-xl font-bold ${overbooked ? "text-red-500" : "text-gray-900"}`}>
                    {totalClientHours}h
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Client hours/week</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <p className={`text-xl font-bold ${utilization > 100 ? "text-red-500" : utilization > 85 ? "text-yellow-600" : "text-green-600"}`}>
                    {Math.round(utilization)}%
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Utilization</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <p className="text-xl font-bold text-green-600">
                    ${totalWeeklyRevenue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Weekly revenue</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <p className="text-xl font-bold text-green-600">
                    ${Math.round(monthlyRevenue).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Monthly revenue</p>
                </div>
              </div>

              {/* Warnings */}
              {overbooked && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  You&apos;re overbooked by <strong>{totalClientHours - availableHours} hours</strong> per week.
                  Something has to give — or you&apos;ll burn out.
                </div>
              )}
              {!overbooked && freeHours > 0 && freeHours < 5 && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
                  You only have <strong>{freeHours} hours</strong> of buffer. One sick day or unexpected
                  meeting and you&apos;re behind.
                </div>
              )}

              {/* Client breakdown */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Client breakdown</p>
                <div className="space-y-2">
                  {breakdown.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 text-xs">
                      <span className="w-28 truncate font-medium">{c.name || "Unnamed"}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(c.pctOfTime, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-500 w-14 text-right">
                        {c.hoursPerWeek}h ({Math.round(c.pctOfTime)}%)
                      </span>
                      <span className="text-gray-400 w-20 text-right">
                        ${Math.round(c.monthlyRevenue).toLocaleString()}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA to product */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Want this schedule built for you — automatically?
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  MyTime generates your entire week across every client in seconds, tracks hours
                  against monthly caps, and integrates Slack, Gmail, and Notion.
                </p>
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-xs"
                >
                  Get Early Access
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
