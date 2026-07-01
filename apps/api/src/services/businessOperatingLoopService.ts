import { nowIso } from "@boss/shared";
import { randomUUID } from "node:crypto";
import {
  deriveKpiReadings,
  analyzeRootCauses,
  generateDecision,
  createExecutionPlan,
  type KpiReading,
} from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";

export interface LoopPhaseResult {
  phase: string;
  status: "completed" | "skipped" | "failed";
  summary: string;
}

export interface OperatingLoopResult {
  orgId: string;
  businessId: string;
  runId: string;
  phases: LoopPhaseResult[];
  kpiReadings: KpiReading[];
  decisionsGenerated: number;
  plansCreated: number;
  completedAt: string;
}

export interface BusinessOperatingLoopService {
  run(orgId: string, businessId: string): Promise<OperatingLoopResult>;
}

export function createBusinessOperatingLoopService(repos: RepositoryContainer): BusinessOperatingLoopService {
  return {
    async run(orgId, businessId) {
      const runId = `loop_${randomUUID()}`;
      const completedAt = nowIso();
      const phases: LoopPhaseResult[] = [];
      let kpiReadings: KpiReading[] = [];
      let decisionsGenerated = 0;
      let plansCreated = 0;

      // Phase 1: Observe — collect all business signals
      const [health, constraints, recommendations, events, workflows, dna] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businessConstraints.listByBusinessId(orgId, businessId),
        repos.businessRecommendations.listByBusinessId(orgId, businessId),
        repos.eventLog.listByOrgId(orgId),
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
        repos.businessDna.findByBusinessId(orgId, businessId),
      ]);

      phases.push({
        phase: "observe",
        status: "completed",
        summary: `Observed ${events.length} events, ${workflows.length} workflows, ${constraints.length} constraints.`,
      });

      // Phase 2: Analyze — derive KPIs + root causes
      const toolExecutionCount = events.filter((e) => e.type === "tool.execution.succeeded").length;
      const workflowCompletionCount = workflows.filter((w) => w.state === "completed").length;

      kpiReadings = deriveKpiReadings({
        overallHealthScore: health?.overallScore,
        toolExecutionCount,
        workflowCompletionCount,
        measuredAt: completedAt,
      });

      const rootCauseResult = health
        ? analyzeRootCauses(constraints, health, recommendations, completedAt)
        : { chains: [], primaryRootCause: null, summary: "No health data.", detectedAt: completedAt };

      phases.push({
        phase: "analyze",
        status: "completed",
        summary: `Derived ${kpiReadings.length} KPI readings. Root cause chains: ${rootCauseResult.chains.length}. Primary: ${rootCauseResult.primaryRootCause ?? "none"}.`,
      });

      // Store KPI baseline for future verification
      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "business",
        ownerId: businessId,
        key: `kpi_baseline:${runId}`,
        value: kpiReadings,
        expiresAt: null,
      });

      if (!health) {
        phases.push({ phase: "decide", status: "skipped", summary: "No health data — decision generation skipped." });
        phases.push({ phase: "plan", status: "skipped", summary: "No decisions to plan." });
        phases.push({ phase: "execute", status: "skipped", summary: "No plans to execute." });
        phases.push({ phase: "verify", status: "skipped", summary: "No executions to verify." });
        phases.push({ phase: "learn", status: "skipped", summary: "Nothing to learn without execution." });
        phases.push({ phase: "improve", status: "skipped", summary: "No improvements queued." });

        await repos.eventBus.publish({
          type: "business.loop.completed",
          payload: { orgId, businessId, runId, decisionsGenerated: 0, plansCreated: 0, completedAt },
          occurredAt: completedAt,
        });

        return { orgId, businessId, runId, phases, kpiReadings, decisionsGenerated: 0, plansCreated: 0, completedAt };
      }

      // Phase 3: Decide — generate new decisions from active recommendations
      const activeRecommendations = recommendations.filter(
        (r) => r.status === "proposed" || r.status === "approved"
      );

      let newDecisionId: string | null = null;

      if (activeRecommendations.length > 0) {
        const generated = generateDecision({ orgId, businessId, health, dna, recommendations: activeRecommendations, constraints });

        const decision = await repos.businessDecisions.create({
          orgId,
          businessId,
          decisionType: generated.decisionType,
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

        newDecisionId = decision.id;
        decisionsGenerated = 1;

        await repos.eventBus.publish({
          type: "business.decision.generated",
          payload: { orgId, businessId, decisionId: decision.id, objective: decision.objective },
          occurredAt: completedAt,
        });

        phases.push({
          phase: "decide",
          status: "completed",
          summary: `Generated 1 decision: "${generated.objective}" (confidence: ${Math.round(generated.confidenceScore * 100)}%).`,
        });

        // Phase 4: Plan — auto-create execution plan for high-confidence decisions
        if (generated.confidenceScore >= 0.75 && newDecisionId) {
          const plan = createExecutionPlan(decision, completedAt);

          await repos.memoryRecords.upsert({
            orgId,
            businessId,
            ownerType: "business",
            ownerId: businessId,
            key: `plan:${newDecisionId}`,
            value: plan,
            expiresAt: null,
          });

          plansCreated = 1;

          await repos.eventBus.publish({
            type: "business.plan.created",
            payload: { orgId, businessId, decisionId: newDecisionId, planKey: plan.planKey, durationDays: plan.durationDays },
            occurredAt: completedAt,
          });

          phases.push({
            phase: "plan",
            status: "completed",
            summary: `Created execution plan "${plan.planKey}" (${plan.durationDays} days, ${plan.tasks.length} tasks).`,
          });
        } else {
          phases.push({
            phase: "plan",
            status: "skipped",
            summary: `Decision confidence ${Math.round(generated.confidenceScore * 100)}% below auto-plan threshold — requires manual approval.`,
          });
        }
      } else {
        phases.push({ phase: "decide", status: "skipped", summary: "No active recommendations — no decisions generated." });
        phases.push({ phase: "plan", status: "skipped", summary: "No decisions to plan." });
      }

      // Phase 5: Execute — record loop execution attempt
      phases.push({
        phase: "execute",
        status: "completed",
        summary: `Loop cycle execution recorded. ${plansCreated} plan(s) queued for workflow execution.`,
      });

      // Phase 6: Verify — snapshot current state for future verification comparison
      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "business",
        ownerId: businessId,
        key: `loop_snapshot:${runId}`,
        value: { kpiReadings, healthScore: health.overallScore, rootCauses: rootCauseResult.chains.length, runId, snapshotAt: completedAt },
        expiresAt: null,
      });

      phases.push({
        phase: "verify",
        status: "completed",
        summary: "Loop state snapshot saved for outcome verification.",
      });

      // Phase 7: Learn — record loop learnings
      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "business",
        ownerId: businessId,
        key: `loop_learning:${runId}`,
        value: {
          runId,
          healthScore: health.overallScore,
          decisionsGenerated,
          plansCreated,
          completedWorkflows: workflowCompletionCount,
          rootCauseCount: rootCauseResult.chains.length,
          recordedAt: completedAt,
        },
        expiresAt: null,
      });

      phases.push({
        phase: "learn",
        status: "completed",
        summary: `Loop learnings recorded: health ${Math.round(health.overallScore)}, ${decisionsGenerated} decision(s), ${rootCauseResult.chains.length} root cause(s).`,
      });

      // Phase 8: Improve — surface improvement opportunities from root cause analysis
      const improvementCount = rootCauseResult.chains.length;
      phases.push({
        phase: "improve",
        status: "completed",
        summary: `${improvementCount} improvement opportunity(ies) identified from root cause analysis.`,
      });

      await repos.eventBus.publish({
        type: "business.loop.completed",
        payload: { orgId, businessId, runId, decisionsGenerated, plansCreated, completedAt },
        occurredAt: completedAt,
      });

      return { orgId, businessId, runId, phases, kpiReadings, decisionsGenerated, plansCreated, completedAt };
    },
  };
}
