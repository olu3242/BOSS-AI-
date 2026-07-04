"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";

interface WorkflowExecution {
  id: string;
  workflowKey: string;
  workflowName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

interface WorkflowStep {
  stepKey: string;
  taskType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  outputSummary: string | null;
  errorMessage: string | null;
}

interface WorkflowDetail extends WorkflowExecution {
  steps: WorkflowStep[];
}

interface Props {
  orgId: string;
  businessId: string;
  initialExecutions: WorkflowExecution[];
  initialError: string | null;
}

type StatusFilter = "all" | "running" | "completed" | "failed" | "awaiting_approval" | "pending";

function statusStyle(status: string) {
  switch (status) {
    case "running": return "bg-blue-900/40 text-blue-400 border border-blue-800/50";
    case "completed": return "bg-green-900/40 text-green-400 border border-green-800/50";
    case "failed": return "bg-red-900/40 text-red-400 border border-red-800/50";
    case "awaiting_approval": return "bg-yellow-900/40 text-yellow-400 border border-yellow-800/50";
    case "compensating": return "bg-orange-900/40 text-orange-400 border border-orange-800/50";
    case "pending": return "bg-neutral-800 text-neutral-400 border border-neutral-700";
    default: return "bg-neutral-800 text-neutral-400 border border-neutral-700";
  }
}

function stepIcon(status: string) {
  if (status === "completed") return "✓";
  if (status === "failed") return "✗";
  if (status === "running") return "●";
  return "○";
}

function stepIconColor(status: string) {
  if (status === "completed") return "text-green-400";
  if (status === "failed") return "text-red-400";
  if (status === "running") return "text-blue-400 animate-pulse";
  return "text-neutral-600";
}

function fmtDuration(ms: number | null) {
  if (ms === null) return null;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "awaiting_approval", label: "Awaiting Approval" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "pending", label: "Pending" },
];

export function WorkflowsClient({ orgId, businessId, initialExecutions, initialError }: Props) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialExecutions);
  const [error, setError] = useState<string | null>(initialError);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const filtered = filter === "all" ? executions : executions.filter((e) => e.status === filter);

  async function loadDetail(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await apiClient.getWorkflowExecution(orgId, businessId, id);
      setDetail(d);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to load workflow detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleRetry(id: string) {
    setRetrying(id);
    setError(null);
    try {
      await apiClient.retryWorkflow(orgId, businessId, id);
      const updated = await apiClient.listWorkflowExecutions(orgId, businessId);
      setExecutions(updated);
      setSelectedId(null);
      setDetail(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to retry workflow.");
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workflow Executions"
        description="Live and historical Loop runtime executions for this business."
      />

      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-neutral-800 overflow-x-auto">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? executions.length : executions.filter((e) => e.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setSelectedId(null); setDetail(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "border-[#C8102E] text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No workflow executions"
          description="Workflow executions appear here when the Loop runtime processes decisions and automated actions."
          dashed={false}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((ex) => (
            <div key={ex.id} className="rounded border border-neutral-800 bg-neutral-900 overflow-hidden">
              <button
                onClick={() => loadDetail(ex.id)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{ex.workflowName || ex.workflowKey}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {fmtTime(ex.startedAt)}
                      {ex.durationMs !== null && <span className="ml-2">· {fmtDuration(ex.durationMs)}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ex.status === "failed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRetry(ex.id); }}
                        disabled={retrying === ex.id}
                        className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                      >
                        {retrying === ex.id ? "Retrying…" : "Retry"}
                      </button>
                    )}
                    <span className={`rounded px-2 py-0.5 text-xs ${statusStyle(ex.status)}`}>{ex.status}</span>
                    <span className="text-neutral-600 text-xs">{selectedId === ex.id ? "▲" : "▼"}</span>
                  </div>
                </div>
              </button>

              {/* Detail panel */}
              {selectedId === ex.id && (
                <div className="border-t border-neutral-800 px-4 py-4">
                  {detailLoading ? (
                    <div className="flex flex-col gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-8 rounded bg-elevated animate-pulse" />
                      ))}
                    </div>
                  ) : detail ? (
                    <div className="flex flex-col gap-3">
                      {detail.errorMessage && (
                        <div className="rounded border border-red-800/50 bg-red-950/20 px-3 py-2 text-xs text-red-400">
                          Error: {detail.errorMessage}
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        {detail.steps.map((step, idx) => (
                          <div
                            key={step.stepKey}
                            className={`flex items-start gap-3 rounded px-3 py-2 ${
                              step.status === "running"
                                ? "bg-blue-950/20 border border-blue-900/30"
                                : step.status === "failed"
                                ? "bg-red-950/10 border border-red-900/20"
                                : "bg-neutral-800/30"
                            }`}
                          >
                            <span className={`mt-0.5 text-sm font-bold w-4 shrink-0 ${stepIconColor(step.status)}`}>
                              {stepIcon(step.status)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-neutral-300">
                                  {idx + 1}. {step.stepKey}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  {step.durationMs !== null && (
                                    <span className="text-xs text-neutral-600">{fmtDuration(step.durationMs)}</span>
                                  )}
                                  <span className="text-xs text-neutral-500 capitalize">{step.taskType}</span>
                                </div>
                              </div>
                              {step.outputSummary && (
                                <p className="mt-0.5 text-xs text-neutral-500 truncate">{step.outputSummary}</p>
                              )}
                              {step.errorMessage && (
                                <p className="mt-0.5 text-xs text-red-400">{step.errorMessage}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
