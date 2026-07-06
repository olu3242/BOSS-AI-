"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { Textarea } from "../../../../../src/components/ui/Input";
import { Button } from "../../../../../src/components/ui/Button";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Badge } from "../../../../../src/components/ui/Badge";
import { Card } from "../../../../../src/components/ui/Card";

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

function decisionBadgeColor(status: string): "yellow" | "green" | "red" | "blue" | "neutral" {
  if (status === "pending" || status === "generated" || status === "reviewed") return "yellow";
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "executed" || status === "completed") return "blue";
  return "neutral";
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
      <PageHeader
        title="Decision Center"
        description="AI-generated decisions from your business health analysis. Review, approve, or reject each decision."
      />

      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
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
                  ? "border-[#C8102E] text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-elevated px-1.5 py-0.5 text-xs text-text-muted">
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
                    ? "border-[#C8102E]/50 bg-surface"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{d.objective}</p>
                    <p className="mt-0.5 text-xs text-text-muted capitalize">{d.decisionType.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-text-muted">
                      {Math.round(d.confidenceScore * 100)}% confidence
                    </span>
                    <Badge color={decisionBadgeColor(d.status)}>{normalizeStatus(d.status)}</Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <Card className="w-80 shrink-0 flex flex-col gap-4">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide">Decision Detail</p>
              <h3 className="mt-1 text-sm font-medium text-text-primary">{selected.objective}</h3>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <Badge color={decisionBadgeColor(selected.status)}>{normalizeStatus(selected.status)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Type</span>
                <span className="text-text-secondary capitalize">{selected.decisionType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Confidence</span>
                <span className="text-text-secondary">{Math.round(selected.confidenceScore * 100)}%</span>
              </div>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className={`h-full rounded-full ${selected.confidenceScore >= 0.75 ? "bg-green-500" : selected.confidenceScore >= 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${selected.confidenceScore * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {selected.confidenceScore >= 0.75 ? "High confidence — safe to approve" : selected.confidenceScore >= 0.5 ? "Medium confidence — review evidence" : "Low confidence — review carefully"}
              </p>
            </div>

            {isPending(selected) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {confirmAction?.type === "reject" && confirmAction.id === selected.id ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Reason for rejection (optional)"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(selected.id)}
                        disabled={actionLoading === selected.id}
                        loading={actionLoading === selected.id}
                        className="flex-1"
                      >
                        {actionLoading === selected.id ? "Rejecting…" : "Confirm Reject"}
                      </Button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 rounded bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-border transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : confirmAction?.type === "approve" && confirmAction.id === selected.id ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-text-muted">Approve this decision? This will queue the recommended workflow for execution.</p>
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
                        className="flex-1 rounded bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-border transition-colors"
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
          </Card>
        )}
      </div>
    </div>
  );
}
