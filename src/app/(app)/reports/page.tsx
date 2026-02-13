"use client";

import { useEffect, useState } from "react";
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
import { BarChart3, Download, AlertTriangle } from "lucide-react";

interface ClientTotal {
  name: string;
  minutes: number;
  color: string;
}

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  clientTotals: Record<string, ClientTotal>;
  uc30Breakdown: { uc30: number; nonUc30: number };
  supportMinutes: number;
  warnings: string[];
  entries: Array<{
    date: string;
    client: string;
    project: string;
    task: string;
    minutes: number;
    notes: string;
  }>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Set default dates to current week
  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    setStartDate(monday.toLocaleDateString("en-CA"));
    setEndDate(friday.toLocaleDateString("en-CA"));
  }, []);

  async function loadReport() {
    if (!startDate || !endDate) return;
    setLoading(true);
    const res = await fetch(
      `/api/reports?period=${period}&startDate=${startDate}&endDate=${endDate}`
    );
    const data = await res.json();
    setReport(data);
    setLoading(false);
  }

  useEffect(() => {
    if (startDate && endDate) loadReport();
  }, [startDate, endDate, period]);

  function exportCsv() {
    window.open(`/api/reports/export?startDate=${startDate}&endDate=${endDate}`);
  }

  const totalMinutes = report
    ? Object.values(report.clientTotals).reduce((sum, c) => sum + c.minutes, 0)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Reports</h2>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
            </div>
            <Button onClick={loadReport} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {report && report.warnings.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {report.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-800">{w}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          {/* Client totals */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(report.clientTotals).map(([id, data]) => {
              const hours = data.minutes / 60;
              const pct = totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0;
              return (
                <Card key={id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="font-medium text-sm">{data.name}</span>
                    </div>
                    <div className="text-2xl font-bold">{hours.toFixed(1)}h</div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: data.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% of total</p>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">Total</span>
                </div>
                <div className="text-2xl font-bold">{(totalMinutes / 60).toFixed(1)}h</div>
              </CardContent>
            </Card>
          </div>

          {/* UC30 breakdown */}
          {(report.uc30Breakdown.uc30 > 0 || report.uc30Breakdown.nonUc30 > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Chandler: UC30 vs Non-UC30</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-bold">{(report.uc30Breakdown.uc30 / 60).toFixed(1)}h</div>
                    <p className="text-xs text-muted-foreground">UC30</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-bold">{(report.uc30Breakdown.nonUc30 / 60).toFixed(1)}h</div>
                    <p className="text-xs text-muted-foreground">Non-UC30</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support time */}
          {report.supportMinutes > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Support Sweep Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{(report.supportMinutes / 60).toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Total support sweep time</p>
              </CardContent>
            </Card>
          )}

          {/* Detailed entries table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {report.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries in this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3">Date</th>
                        <th className="text-left py-2 pr-3">Client</th>
                        <th className="text-left py-2 pr-3">Project</th>
                        <th className="text-left py-2 pr-3">Task</th>
                        <th className="text-right py-2 pr-3">Minutes</th>
                        <th className="text-left py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.entries.map((e, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 pr-3 text-xs">{e.date}</td>
                          <td className="py-1.5 pr-3">{e.client}</td>
                          <td className="py-1.5 pr-3 text-muted-foreground">{e.project}</td>
                          <td className="py-1.5 pr-3 text-muted-foreground">{e.task}</td>
                          <td className="py-1.5 pr-3 text-right font-mono">{e.minutes?.toFixed(0)}</td>
                          <td className="py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">{e.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
