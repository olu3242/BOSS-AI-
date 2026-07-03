"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";

interface KpiProjection {
  kpiKey: string;
  label: string;
  currentValue: number | null;
  projectedValue: number | null;
  unit: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  status: string;
  timeHorizonMonths: number;
  priorityFocus: string;
  confidenceScore: number;
  projectedRevenueImpact: number | null;
  riskLevel: string;
  keyAssumptions: string[];
  kpiProjections: KpiProjection[];
  createdAt: string;
}

interface Props {
  orgId: string;
  businessId: string;
  initialScenarios: Scenario[];
  initialError: string | null;
}

const PRIORITY_OPTIONS = [
  { value: "revenue", label: "Revenue Growth" },
  { value: "customers", label: "Customer Acquisition" },
  { value: "operations", label: "Operational Efficiency" },
  { value: "cost", label: "Cost Reduction" },
];

const HORIZON_OPTIONS = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

function riskBadge(level: string) {
  switch (level) {
    case "low": return "bg-green-900/40 text-green-400 border border-green-800/50";
    case "medium": return "bg-yellow-900/40 text-yellow-400 border border-yellow-800/50";
    case "high": return "bg-red-900/40 text-red-400 border border-red-800/50";
    default: return "bg-neutral-800 text-neutral-400 border border-neutral-700";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "active": return "bg-blue-900/40 text-blue-400 border border-blue-800/50";
    case "draft": return "bg-neutral-800 text-neutral-400 border border-neutral-700";
    case "archived": return "bg-neutral-900 text-neutral-600 border border-neutral-800";
    default: return "bg-neutral-800 text-neutral-400 border border-neutral-700";
  }
}

function fmt(val: number | null, unit: string) {
  if (val === null) return "N/A";
  if (unit === "currency" || unit === "dollars") return `$${val.toLocaleString()}`;
  if (unit === "percent" || unit === "%") return `${val}%`;
  return `${val} ${unit}`;
}

export function ScenariosClient({ orgId, businessId, initialScenarios, initialError }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);
  const [error, setError] = useState<string | null>(initialError);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    timeHorizonMonths: 6,
    priorityFocus: "revenue",
    description: "",
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiClient.createScenario(orgId, businessId, form);
      // Refresh list
      const updated = await apiClient.listScenarios(orgId, businessId);
      setScenarios(updated);
      setShowForm(false);
      setForm({ name: "", timeHorizonMonths: 6, priorityFocus: "revenue", description: "" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to create scenario.");
    } finally {
      setCreating(false);
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const compareScenarios = scenarios.filter((s) => compareIds.includes(s.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Strategic Planning</p>
          <h1 className="mt-1 font-display text-3xl">Scenario Planning</h1>
          <p className="mt-2 text-sm text-neutral-400">Model strategic scenarios and compare projected outcomes before committing resources.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          + Generate Scenario
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Generate form */}
      {showForm && (
        <div className="rounded border border-neutral-700 bg-neutral-900 p-5 flex flex-col gap-4">
          <h3 className="text-sm font-medium text-white">New Scenario</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Scenario Name</label>
              <input
                className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                placeholder="e.g. Expand to second location"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Time Horizon</label>
              <select
                className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
                value={form.timeHorizonMonths}
                onChange={(e) => setForm((f) => ({ ...f, timeHorizonMonths: Number(e.target.value) }))}
              >
                {HORIZON_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Priority Focus</label>
              <select
                className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500"
                value={form.priorityFocus}
                onChange={(e) => setForm((f) => ({ ...f, priorityFocus: e.target.value }))}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Description (optional)</label>
              <input
                className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                placeholder="Brief context for this scenario"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="rounded px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="rounded bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {creating ? "Generating…" : "Generate Scenario"}
            </button>
          </div>
        </div>
      )}

      {/* Compare panel */}
      {compareIds.length >= 2 && (
        <div className="rounded border border-blue-900/50 bg-blue-950/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-400">Scenario Comparison ({compareIds.length}/3)</h3>
            <button onClick={() => setCompareIds([])} className="text-xs text-neutral-500 hover:text-white transition-colors">Clear</button>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareScenarios.length}, 1fr)` }}>
            {compareScenarios.map((s) => (
              <div key={s.id} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-white">{s.name}</p>
                <p className="text-xs text-neutral-500">{s.timeHorizonMonths}mo · {s.priorityFocus.replace(/_/g, " ")}</p>
                {s.projectedRevenueImpact !== null && (
                  <p className={`text-sm font-bold ${s.projectedRevenueImpact >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {s.projectedRevenueImpact >= 0 ? "+" : ""}${s.projectedRevenueImpact.toLocaleString()} revenue
                  </p>
                )}
                <span className={`self-start rounded px-2 py-0.5 text-xs ${riskBadge(s.riskLevel)}`}>{s.riskLevel} risk</span>
                {s.kpiProjections.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    {s.kpiProjections.slice(0, 3).map((k) => (
                      <div key={k.kpiKey} className="text-xs text-neutral-400 flex justify-between">
                        <span>{k.label}</span>
                        <span className="text-white">{fmt(k.projectedValue, k.unit)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario list */}
      {scenarios.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-400 font-medium">No scenarios yet</p>
          <p className="mt-1 text-sm text-neutral-600">Generate your first scenario to model strategic options and compare projected outcomes.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 rounded bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Generate Your First Scenario
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {compareIds.length > 0 && compareIds.length < 2 && (
            <p className="text-xs text-neutral-500">Select one more scenario to compare (up to 3).</p>
          )}
          {scenarios.map((s) => (
            <div key={s.id} className="rounded border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-white">{s.name}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(s.status)}`}>{s.status}</span>
                    <span className={`rounded px-2 py-0.5 text-xs ${riskBadge(s.riskLevel)}`}>{s.riskLevel} risk</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {s.timeHorizonMonths} months · Focus: {PRIORITY_OPTIONS.find((p) => p.value === s.priorityFocus)?.label ?? s.priorityFocus}
                  </p>
                  {s.description && <p className="mt-1 text-xs text-neutral-400">{s.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.projectedRevenueImpact !== null && (
                    <span className={`text-sm font-bold ${s.projectedRevenueImpact >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {s.projectedRevenueImpact >= 0 ? "+" : ""}${s.projectedRevenueImpact.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">{Math.round(s.confidenceScore * 100)}% confidence</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="text-xs text-neutral-500 hover:text-white transition-colors"
                >
                  {expandedId === s.id ? "Hide details" : "Show details"}
                </button>
                <span className="text-neutral-700">·</span>
                <button
                  onClick={() => toggleCompare(s.id)}
                  className={`text-xs transition-colors ${compareIds.includes(s.id) ? "text-blue-400 hover:text-blue-300" : "text-neutral-500 hover:text-white"}`}
                >
                  {compareIds.includes(s.id) ? "Remove from comparison" : "Compare"}
                </button>
              </div>

              {expandedId === s.id && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 border-t border-neutral-800 pt-4">
                  {s.keyAssumptions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Key Assumptions</p>
                      <ul className="flex flex-col gap-1">
                        {s.keyAssumptions.map((a, i) => (
                          <li key={i} className="text-xs text-neutral-400 flex gap-2">
                            <span className="text-neutral-600">·</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.kpiProjections.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">KPI Projections</p>
                      <div className="flex flex-col gap-1">
                        {s.kpiProjections.map((k) => (
                          <div key={k.kpiKey} className="flex justify-between text-xs">
                            <span className="text-neutral-400">{k.label}</span>
                            <div className="flex gap-2 text-neutral-300">
                              <span className="text-neutral-600">{fmt(k.currentValue, k.unit)}</span>
                              <span>→</span>
                              <span className={k.projectedValue !== null && k.currentValue !== null && k.projectedValue > k.currentValue ? "text-green-400" : "text-red-400"}>
                                {fmt(k.projectedValue, k.unit)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
