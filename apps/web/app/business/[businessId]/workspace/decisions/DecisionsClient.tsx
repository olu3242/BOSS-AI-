"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";

interface Decision {
  id: string;
  objective: string;
  status: string;
  confidenceScore: number;
  decisionType: string;
}

interface Props {
  orgId: string;
  businessId: string;
  initialDecisions: Decision[];
  initialError: string | null;
}

type Tab = "all" | "pending" | "approved" | "executed";

function statusBadge(status: string) {
  switch (status) {
    case "pending":
    case "generated":
    case "reviewed":
      return "bg-yellow-900/40 text-yellow-400 border border-yellow-800/50";
    case "approved":
      return "bg-green-900/40 text-green-400 border border-green-800/50";
    case "rejected":
      return "bg-red-900/40 text-red-400 border border-red-800/50";
    case "executed":
    case "completed":
      return "bg-blue-900/40 text-blue-400 border border-blue-800/50";
    default:
      return "bg-neutral-800 text-neutral-400 border border-neutral-700";
  }
}

function normalizeStatus(status: string): string {
  if (status === "generated" || status === "reviewed") return "pending";
  if (status === "completed") return "executed";
  return status;
}

export function DecisionsClient({ orgId, businessId: _businessId, initialDecisions, initialError }: Props) {
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions);
  const [error, setError] = useState<string | null>(initialError);
  const [tab, setTab] = useState<Tab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; id: string } | null>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "executed", label: "Executed" },
  ];

  const filtered = decisions.filter((d) => {
    if (tab === "all") return true;
    const norm = normalizeStatus(d.status);
    if (tab === "pending") return norm === "pending";
    if (tab === "approved") return d.status === "approved";
    if (tab === "executed") return norm === "executed";
    return true;
  });

  const selected = decisions.find((d) => d.id === selectedId) ?? null;

  async function handleApprove(id: string) {
    setActionLoading(id);
    setError(null);
    try {
      const { decision } = await apiClient.approveDecision(orgId, id);
      setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, status: decision.status } : d));
      setConfirmAction(null);
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to approve decision.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    setError(null);
    try {
      const { decision } = await apiClient.rejectDecision(orgId, id, rejectReason || "Rejected by user");
      setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, status: decision.status } : d));
      setConfirmAction(null);
      setRejectReason("");
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to reject decision.");
    } finally {
      setActionLoading(null);
    }
  }

  const isPending = (d: Decision) => {
    const n = normalizeStatus(d.status);
    return n === "pending";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">AI Command</p>
        <h1 className="mt-1 font-display text-3xl">Decision Center</h1>
        <p className="mt-2 text-sm text-neutral-400">
          AI-generated decisions from your business health analysis. Review, approve, or reject each decision.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-800 pb-0">
        {tabs.map((t) => {
          const count = t.key === "all"
            ? decisions.length
            : decisions.filter((d) => normalizeStatus(d.status) === t.key || d.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedId(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-[#C8102E] text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="No decisions yet"
              description="Decisions are generated automatically from your business health analysis. Run your first MRI to get started."
              dashed={false}
            />
          ) : (
            filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
                className={`w-full text-left rounded border p-4 transition-colors ${
                  selectedId === d.id
                    ? "border-[#C8102E]/50 bg-neutral-900"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{d.objective}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 capitalize">{d.decisionType.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-neutral-400">
                      {Math.round(d.confidenceScore * 100)}% confidence
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(d.status)}`}>
                      {normalizeStatus(d.status)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 rounded border border-neutral-800 bg-neutral-900 p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Decision Detail</p>
              <h3 className="mt-1 text-sm font-medium text-white">{selected.objective}</h3>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Status</span>
                <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(selected.status)}`}>
                  {normalizeStatus(selected.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Type</span>
                <span className="text-neutral-300 capitalize">{selected.decisionType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Confidence</span>
                <span className="text-neutral-300">{Math.round(selected.confidenceScore * 100)}%</span>
              </div>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${selected.confidenceScore >= 0.75 ? "bg-green-500" : selected.confidenceScore >= 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${selected.confidenceScore * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                {selected.confidenceScore >= 0.75 ? "High confidence — safe to approve" : selected.confidenceScore >= 0.5 ? "Medium confidence — review evidence" : "Low confidence — review carefully"}
              </p>
            </div>

            {isPending(selected) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
                {confirmAction?.type === "reject" && confirmAction.id === selected.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                      placeholder="Reason for rejection (optional)"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(selected.id)}
                        disabled={actionLoading === selected.id}
                        className="flex-1 rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selected.id ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : confirmAction?.type === "approve" && confirmAction.id === selected.id ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-neutral-400">Approve this decision? This will queue the recommended workflow for execution.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selected.id)}
                        disabled={actionLoading === selected.id}
                        className="flex-1 rounded bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selected.id ? "Approving…" : "Confirm Approve"}
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 rounded bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmAction({ type: "approve", id: selected.id })}
                      className="flex-1 rounded bg-green-900/50 border border-green-800/60 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: "reject", id: selected.id })}
                      className="flex-1 rounded bg-red-900/50 border border-red-800/60 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
