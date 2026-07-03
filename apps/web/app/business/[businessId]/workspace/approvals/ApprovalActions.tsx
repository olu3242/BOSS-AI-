"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";

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
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending !== null}
          className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={pending !== null}
          className="rounded bg-neutral-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface RecommendationActionsProps {
  recommendationId: string;
  orgId: string;
}

export function RecommendationActions({ recommendationId, orgId }: RecommendationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "dismiss" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setPending("approve");
    setError(null);
    try {
      await apiClient.approveRecommendation(orgId, recommendationId);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to approve.");
      setPending(null);
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending !== null}
          className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending === "approve" ? "Approving…" : "Approve"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
