import { nowIso } from "@boss/shared";
import { deriveKpiReadings, verifyOutcome, type VerificationResult } from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";

export interface OutcomeVerificationService {
  verify(orgId: string, businessId: string, decisionId: string): Promise<VerificationResult>;
  getVerification(orgId: string, businessId: string, decisionId: string): Promise<VerificationResult | null>;
}

export function createOutcomeVerificationService(repos: RepositoryContainer): OutcomeVerificationService {
  return {
    async verify(orgId, businessId, decisionId) {
      const verifiedAt = nowIso();

      const [decision, health, events, workflows] = await Promise.all([
        repos.businessDecisions.findById(orgId, decisionId),
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.eventLog.listByOrgId(orgId),
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
      ]);

      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const toolExecutionCount = events.filter((e) => e.type === "tool.execution.succeeded").length;
      const workflowCompletionCount = workflows.filter((w) => w.state === "completed").length;

      const currentReadings = deriveKpiReadings({
        overallHealthScore: health?.overallScore,
        toolExecutionCount,
        workflowCompletionCount,
        measuredAt: verifiedAt,
      });

      const baselineRecord = await repos.memoryRecords.get(
        orgId, businessId, "business", businessId, `baseline:${decisionId}`
      );
      const baselineReadings = baselineRecord
        ? (baselineRecord.value as typeof currentReadings)
        : [];

      const result = verifyOutcome(decision, baselineReadings, currentReadings, verifiedAt);

      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "business",
        ownerId: businessId,
        key: `verification:${decisionId}`,
        value: result,
        expiresAt: null,
      });

      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "business",
        ownerId: businessId,
        key: `learning:${decisionId}`,
        value: {
          decisionId,
          outcome: result.status,
          confidence: result.confidence,
          kpiDeltas: result.kpiDeltas,
          recordedAt: verifiedAt,
        },
        expiresAt: null,
      });

      await repos.eventBus.publish({
        type: "business.outcome.verified",
        payload: { orgId, businessId, decisionId, status: result.status, confidence: result.confidence, verifiedAt },
        occurredAt: verifiedAt,
      });

      await repos.eventBus.publish({
        type: "business.learning.recorded",
        payload: { orgId, businessId, decisionId, outcome: result.status, recordedAt: verifiedAt },
        occurredAt: verifiedAt,
      });

      return result;
    },

    async getVerification(orgId, businessId, decisionId) {
      const record = await repos.memoryRecords.get(
        orgId, businessId, "business", businessId, `verification:${decisionId}`
      );
      if (!record) return null;
      return record.value as VerificationResult;
    },
  };
}
