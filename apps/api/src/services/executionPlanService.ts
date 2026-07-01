import { nowIso } from "@boss/shared";
import { createExecutionPlan, type ExecutionPlan } from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";

export interface ExecutionPlanService {
  createPlan(orgId: string, businessId: string, decisionId: string): Promise<ExecutionPlan>;
  getPlan(orgId: string, businessId: string, decisionId: string): Promise<ExecutionPlan | null>;
}

export function createExecutionPlanService(repos: RepositoryContainer): ExecutionPlanService {
  return {
    async createPlan(orgId, businessId, decisionId) {
      const createdAt = nowIso();

      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const plan = createExecutionPlan(decision, createdAt);

      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "business",
        ownerId: businessId,
        key: `plan:${decisionId}`,
        value: plan,
        expiresAt: null,
      });

      await repos.eventBus.publish({
        type: "business.plan.created",
        payload: { orgId, businessId, decisionId, planKey: plan.planKey, durationDays: plan.durationDays, createdAt },
        occurredAt: createdAt,
      });

      return plan;
    },

    async getPlan(orgId, businessId, decisionId) {
      const record = await repos.memoryRecords.get(orgId, businessId, "business", businessId, `plan:${decisionId}`);
      if (!record) return null;
      return record.value as ExecutionPlan;
    },
  };
}
