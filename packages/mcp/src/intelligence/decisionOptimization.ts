import type { BusinessDecision, BusinessScenario, MemoryRecord } from "@boss/types";

export interface OptimizationSignal {
  type:
    | "repeated_failure"
    | "successful_strategy"
    | "emerging_risk"
    | "missed_opportunity"
    | "execution_bottleneck"
    | "decision_drift"
    | "policy_conflict"
    | "workflow_inefficiency";
  severity: "info" | "warning" | "critical";
  description: string;
  affectedDecisionIds: string[];
  recommendation: string;
}

export interface OptimizationReport {
  signals: OptimizationSignal[];
  overallHealthScore: number;
  learningInsights: string[];
  nextActions: string[];
}

/**
 * Deterministic continuous optimization over historical decisions.
 * Identifies patterns, failures, and emerging risks — no LLM calls here.
 * All improvement recommendations are emitted as events for the learning loop.
 */
export function optimizeDecisions(
  decisions: BusinessDecision[],
  scenarios: BusinessScenario[],
  memoryRecords: MemoryRecord[]
): OptimizationReport {
  const signals: OptimizationSignal[] = [];
  const learningInsights: string[] = [];
  const nextActions: string[] = [];

  // Pattern: Repeated failures in the same decision type
  const failedByType = new Map<string, string[]>();
  for (const d of decisions) {
    if (d.status === "measured" && d.actualRoi !== null && d.actualRoi < 0) {
      const ids = failedByType.get(d.decisionType) ?? [];
      ids.push(d.id);
      failedByType.set(d.decisionType, ids);
    }
  }
  for (const [type, ids] of failedByType) {
    if (ids.length >= 2) {
      signals.push({
        type: "repeated_failure",
        severity: "critical",
        description: `${ids.length} ${type} decisions produced negative ROI`,
        affectedDecisionIds: ids,
        recommendation: `Pause ${type} initiatives until root cause is identified`,
      });
      learningInsights.push(`Avoid ${type} decisions until strategy is reviewed`);
      nextActions.push(`Conduct post-mortem on ${type} decision failures`);
    }
  }

  // Pattern: Successful strategies to repeat
  const successfulTypes = new Map<string, number>();
  for (const d of decisions) {
    if (d.status === "measured" && d.actualRoi !== null && d.actualRoi > 0) {
      successfulTypes.set(d.decisionType, (successfulTypes.get(d.decisionType) ?? 0) + 1);
    }
  }
  for (const [type, count] of successfulTypes) {
    if (count >= 2) {
      signals.push({
        type: "successful_strategy",
        severity: "info",
        description: `${count} successful ${type} decisions — proven strategy`,
        affectedDecisionIds: decisions.filter((d) => d.decisionType === type && d.actualRoi && d.actualRoi > 0).map((d) => d.id),
        recommendation: `Prioritize additional ${type} decisions`,
      });
      learningInsights.push(`${type} decisions consistently deliver positive ROI`);
    }
  }

  // Pattern: Decision drift — high-confidence decisions not being approved
  const pendingHighConfidence = decisions.filter(
    (d) => d.status === "generated" && d.confidenceScore >= 0.8
  );
  if (pendingHighConfidence.length >= 3) {
    signals.push({
      type: "decision_drift",
      severity: "warning",
      description: `${pendingHighConfidence.length} high-confidence decisions awaiting approval`,
      affectedDecisionIds: pendingHighConfidence.map((d) => d.id),
      recommendation: "Review and approve pending high-confidence decisions to avoid missed opportunities",
    });
    nextActions.push("Schedule decision review meeting — high-confidence actions stalling");
  }

  // Pattern: Execution bottleneck — too many decisions in 'executing' state
  const executing = decisions.filter((d) => d.status === "executing");
  if (executing.length >= 3) {
    signals.push({
      type: "execution_bottleneck",
      severity: "warning",
      description: `${executing.length} decisions currently executing simultaneously`,
      affectedDecisionIds: executing.map((d) => d.id),
      recommendation: "Throttle new approvals until in-progress decisions complete",
    });
  }

  // Pattern: Scenario divergence — scenarios created but no decisions generated
  if (scenarios.length > 0 && decisions.length === 0) {
    signals.push({
      type: "missed_opportunity",
      severity: "info",
      description: `${scenarios.length} scenario(s) exist but no decisions have been generated`,
      affectedDecisionIds: [],
      recommendation: "Convert top-scoring scenarios into decisions",
    });
    nextActions.push("Generate decisions from highest-scoring scenarios");
  }

  // Learning from memory records
  const decisionMemory = memoryRecords.filter((m) => m.key.startsWith("decision:"));
  if (decisionMemory.length > 0) {
    learningInsights.push(`${decisionMemory.length} decision outcomes stored in business memory`);
  }

  const measuredDecisions = decisions.filter((d) => d.status === "measured" && d.actualRoi !== null);
  const avgActualRoi = measuredDecisions.length > 0
    ? measuredDecisions.reduce((sum, d) => sum + (d.actualRoi ?? 0), 0) / measuredDecisions.length
    : null;

  if (avgActualRoi !== null) {
    learningInsights.push(`Average actual ROI across ${measuredDecisions.length} completed decision(s): $${avgActualRoi.toFixed(0)}`);
  }

  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const warningCount = signals.filter((s) => s.severity === "warning").length;
  const overallHealthScore = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);

  return { signals, overallHealthScore, learningInsights, nextActions };
}

export interface DecisionPriorityScore {
  decisionId: string;
  score: number;
  breakdown: {
    roiScore: number;
    confidenceScore: number;
    riskScore: number;
    operationalReadiness: number;
  };
}

export function prioritizeDecisions(decisions: BusinessDecision[]): DecisionPriorityScore[] {
  return decisions
    .filter((d) => d.status === "generated" || d.status === "reviewed")
    .map((d) => {
      const roiScore = Math.min(100, (d.expectedRoi / Math.max(1, d.expectedCost)) * 20);
      const confidenceScore = d.confidenceScore * 100;
      const riskScore = { low: 100, medium: 70, high: 40, critical: 10 }[d.expectedImpact.riskLevel] ?? 50;
      const operationalReadiness = d.options.length > 0 ? 80 : 40;

      const score = (roiScore * 0.3 + confidenceScore * 0.25 + riskScore * 0.25 + operationalReadiness * 0.2);

      return {
        decisionId: d.id,
        score: Math.round(score * 10) / 10,
        breakdown: {
          roiScore: Math.round(roiScore),
          confidenceScore: Math.round(confidenceScore),
          riskScore,
          operationalReadiness,
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}
