"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { Button } from "../../../../../src/components/ui/Button";

interface DecisionActionsProps {
  decisionId: string;
  orgId: string;
}

export function DecisionActions({ decisionId, orgId }: DecisionActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setPending("approve");
    setError(null);
    try {
      await apiClient.approveDecision(orgId, decisionId);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to approve.");
      setPending(null);
    }
  }

  async function reject() {
    setPending("reject");
    setError(null);
    try {
      await apiClient.rejectDecision(orgId, decisionId, "Rejected by owner");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to reject.");
      setPending(null);
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex gap-2">
        <Button size="sm" onClick={approve} disabled={pending !== null} loading={pending === "approve"}>
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={reject} disabled={pending !== null} loading={pending === "reject"}>
          Reject
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-status-danger">{error}</p>}
    </div>
  );
}

interface RecommendationActionsProps {
  recommendationId: string;
  orgId: string;
  businessId: string;
}

export function RecommendationActions({ recommendationId, orgId, businessId }: RecommendationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | null>(null);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setPending("approve");
    setError(null);
    try {
      await apiClient.approveRecommendation(orgId, recommendationId);
      setApproved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to approve.");
      setPending(null);
    }
  }

  if (approved) {
    return (
      <div className="mt-3 border-t border-neutral-800 pt-3">
        <div className="rounded border border-green-800/50 bg-green-950/20 px-3 py-2.5 flex items-start gap-2.5">
          <span className="text-green-400 text-sm mt-0.5">✓</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-300">Workflow initiated</p>
            <p className="mt-0.5 text-xs text-green-600">
              BOSS is executing this recommendation via the Loop runtime.{" "}
              <Link
                href={`/business/${businessId}/workspace/workflows`}
                className="text-green-400 underline hover:text-green-300"
              >
                View in Workflows →
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending !== null}
          className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending === "approve" ? "Approving…" : "Approve & Run"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-status-danger">{error}</p>}
    </div>
  );
}
