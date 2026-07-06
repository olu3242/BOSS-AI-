"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
}

export function RecommendationActions({ recommendationId, orgId }: RecommendationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | null>(null);
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
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex gap-2">
        <Button size="sm" onClick={approve} disabled={pending !== null} loading={pending === "approve"}>
          Approve
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-status-danger">{error}</p>}
    </div>
  );
}
