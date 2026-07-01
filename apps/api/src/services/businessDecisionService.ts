import { nowIso } from "@boss/shared";
import {
  generateDecision,
  evaluateDecisionHealth,
  generateExecutiveBrief,
  optimizeDecisions,
  prioritizeDecisions,
} from "@boss/mcp";
import type { BusinessDecision, DecisionStatus } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface DecisionGenerateInput {
  recommendationIds: string[];
  decisionType?: BusinessDecision["decisionType"];
}

export interface DecisionMeasureInput {
  actualRoi: number;
  lessonsLearned: string;
}

export interface BusinessDecisionService {
  generate(orgId: string, businessId: string, input: DecisionGenerateInput): Promise<BusinessDecision>;
  evaluate(orgId: string, decisionId: string): Promise<{ decision: BusinessDecision; health: ReturnType<typeof evaluateDecisionHealth> }>;
  getExecutiveBrief(orgId: string, decisionId: string): Promise<BusinessDecision & { brief: Awaited<ReturnType<typeof generateExecutiveBrief>> }>;
  approve(orgId: string, decisionId: string): Promise<BusinessDecision>;
  reject(orgId: string, decisionId: string): Promise<BusinessDecision>;
  schedule(orgId: string, decisionId: string): Promise<BusinessDecision>;
  measure(orgId: string, decisionId: string, input: DecisionMeasureInput): Promise<BusinessDecision>;
  archive(orgId: string, decisionId: string): Promise<BusinessDecision>;
  list(orgId: string, businessId: string): Promise<BusinessDecision[]>;
  listByStatus(orgId: string, businessId: string, status: DecisionStatus): Promise<BusinessDecision[]>;
  getOptimizationReport(orgId: string, businessId: string): Promise<ReturnType<typeof optimizeDecisions>>;
  getPriorityRanking(orgId: string, businessId: string): Promise<ReturnType<typeof prioritizeDecisions>>;
}

export function createBusinessDecisionService(repos: RepositoryContainer): BusinessDecisionService {
  return {
    async generate(orgId, businessId, input) {
      const [health, constraints, allRecommendations] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businessConstraints.listByBusinessId(orgId, businessId),
        repos.businessRecommendations.listByBusinessId(orgId, businessId),
      ]);

      if (!health) throw new Error(`No health data for business ${businessId} — run health analysis first`);

      const recommendations = input.recommendationIds.length > 0
        ? allRecommendations.filter((r) => input.recommendationIds.includes(r.id))
        : allRecommendations.filter((r) => r.status === "proposed" || r.status === "approved");

      const dna = await repos.businessDna.findByBusinessId(orgId, businessId);

      const generated = generateDecision({
        orgId,
        businessId,
        health,
        dna,
        recommendations,
        constraints,
      });

      const decision = await repos.businessDecisions.create({
        orgId,
        businessId,
        decisionType: input.decisionType ?? generated.decisionType,
        objective: generated.objective,
        context: generated.context,
        supportingRecommendationIds: generated.supportingRecommendationIds,
        supportingConstraintIds: generated.supportingConstraintIds,
        appliedPolicyKeys: generated.appliedPolicyKeys,
        options: generated.options,
        selectedOptionKey: generated.selectedOptionKey,
        expectedImpact: generated.expectedImpact,
        expectedRoi: generated.expectedRoi,
        expectedCost: generated.expectedCost,
        confidenceScore: generated.confidenceScore,
        status: "generated",
        approvedAt: null,
        rejectedAt: null,
        completedAt: null,
        measuredAt: null,
        actualRoi: null,
        lessonsLearned: null,
        executiveSummary: null,
        generatedWorkflowId: null,
      });

      await repos.eventBus.publish({
        type: "decision.generated",
        payload: { orgId, businessId, decisionId: decision.id, decisionType: decision.decisionType },
        occurredAt: nowIso(),
      });

      return decision;
    },

    async evaluate(orgId, decisionId) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const health = evaluateDecisionHealth(decision);

      await repos.eventBus.publish({
        type: "decision.evaluated",
        payload: { orgId, businessId: decision.businessId, decisionId, healthScore: health.score },
        occurredAt: nowIso(),
      });

      return { decision, health };
    },

    async getExecutiveBrief(orgId, decisionId) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const [health, allRecommendations, constraints] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, decision.businessId),
        repos.businessRecommendations.listByBusinessId(orgId, decision.businessId),
        repos.businessConstraints.listByBusinessId(orgId, decision.businessId),
      ]);

      const topRecommendations = allRecommendations
        .filter((r) => decision.supportingRecommendationIds.includes(r.id))
        .slice(0, 3);
      const topConstraints = constraints
        .filter((c) => decision.supportingConstraintIds.includes(c.id))
        .slice(0, 2);

      const brief = await generateExecutiveBrief({
        decision,
        health: health!,
        topRecommendations,
        topConstraints,
      });

      // Persist executive summary back onto the decision
      const updated = await repos.businessDecisions.update(orgId, decisionId, {
        executiveSummary: brief.executiveSummary,
      });

      await repos.eventBus.publish({
        type: "decision.brief.generated",
        payload: { orgId, businessId: decision.businessId, decisionId },
        occurredAt: nowIso(),
      });

      return { ...updated, brief };
    },

    async approve(orgId, decisionId) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);
      if (!["generated", "reviewed"].includes(decision.status)) {
        throw new Error(`Decision ${decisionId} cannot be approved from status "${decision.status}"`);
      }

      const updated = await repos.businessDecisions.update(orgId, decisionId, {
        status: "approved",
        approvedAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "decision.approved",
        payload: { orgId, businessId: decision.businessId, decisionId },
        occurredAt: nowIso(),
      });

      return updated;
    },

    async reject(orgId, decisionId) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const updated = await repos.businessDecisions.update(orgId, decisionId, {
        status: "rejected",
        rejectedAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "decision.rejected",
        payload: { orgId, businessId: decision.businessId, decisionId },
        occurredAt: nowIso(),
      });

      return updated;
    },

    async schedule(orgId, decisionId) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);
      if (decision.status !== "approved") {
        throw new Error(`Decision ${decisionId} must be approved before scheduling`);
      }

      const updated = await repos.businessDecisions.update(orgId, decisionId, { status: "scheduled" });

      await repos.eventBus.publish({
        type: "decision.scheduled",
        payload: { orgId, businessId: decision.businessId, decisionId },
        occurredAt: nowIso(),
      });

      return updated;
    },

    async measure(orgId, decisionId, input) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const updated = await repos.businessDecisions.update(orgId, decisionId, {
        status: "measured",
        measuredAt: nowIso(),
        actualRoi: input.actualRoi,
        lessonsLearned: input.lessonsLearned,
      });

      // Learning loop: persist outcome to business memory
      await repos.memoryRecords.upsert({
        orgId,
        businessId: decision.businessId,
        ownerType: "business",
        ownerId: decision.businessId,
        key: `decision:${decisionId}:outcome`,
        value: {
          decisionType: decision.decisionType,
          objective: decision.objective,
          expectedRoi: decision.expectedRoi,
          actualRoi: input.actualRoi,
          roiDelta: input.actualRoi - decision.expectedRoi,
          lessonsLearned: input.lessonsLearned,
          measuredAt: nowIso(),
        },
        expiresAt: null,
      });

      await repos.eventBus.publish({
        type: "decision.measured",
        payload: {
          orgId, businessId: decision.businessId, decisionId,
          actualRoi: input.actualRoi, expectedRoi: decision.expectedRoi,
        },
        occurredAt: nowIso(),
      });

      return updated;
    },

    async archive(orgId, decisionId) {
      const decision = await repos.businessDecisions.findById(orgId, decisionId);
      if (!decision) throw new Error(`Decision ${decisionId} not found`);

      const updated = await repos.businessDecisions.update(orgId, decisionId, { status: "archived" });

      await repos.eventBus.publish({
        type: "decision.archived",
        payload: { orgId, businessId: decision.businessId, decisionId },
        occurredAt: nowIso(),
      });

      return updated;
    },

    async list(orgId, businessId) {
      return repos.businessDecisions.listByBusinessId(orgId, businessId);
    },

    async listByStatus(orgId, businessId, status) {
      return repos.businessDecisions.listByStatus(orgId, businessId, status);
    },

    async getOptimizationReport(orgId, businessId) {
      const [decisions, scenarios, memory] = await Promise.all([
        repos.businessDecisions.listByBusinessId(orgId, businessId),
        repos.businessScenarios.listByBusinessId(orgId, businessId),
        repos.memoryRecords.listByOwner(orgId, businessId, "business", businessId),
      ]);
      return optimizeDecisions(decisions, scenarios, memory);
    },

    async getPriorityRanking(orgId, businessId) {
      const decisions = await repos.businessDecisions.listByBusinessId(orgId, businessId);
      return prioritizeDecisions(decisions);
    },
  };
}
