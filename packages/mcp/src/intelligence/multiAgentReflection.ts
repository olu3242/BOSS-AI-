import type { AgentPlan } from "./multiAgentPlanner.js";

export interface AgentStepOutcome {
  stepKey: string;
  employeeKey: string;
  capabilityKey: string;
  succeeded: boolean;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
}

export interface ReflectionResult {
  planId: string;
  achieved: boolean;
  successRate: number;
  summary: string;
  failedSteps: string[];
  nextActions: string[];
  reflectedAt: string;
}

/**
 * Synthesizes multi-agent execution outcomes into a structured reflection.
 * Pure intelligence — deterministic rule-based analysis (TD-024 reserves
 * real LLM inference for a future goal when Claude API is integrated).
 */
export function reflectOnOutcomes(plan: AgentPlan, outcomes: AgentStepOutcome[]): ReflectionResult {
  const succeeded = outcomes.filter((o) => o.succeeded);
  const failed = outcomes.filter((o) => !o.succeeded);
  const successRate = outcomes.length > 0 ? succeeded.length / outcomes.length : 0;
  const achieved = successRate >= 0.8; // ≥80% success = goal achieved

  const failedSteps = failed.map((o) => `${o.stepKey}(${o.employeeKey}): ${o.errorMessage ?? "unknown"}`);

  const nextActions: string[] = [];
  if (failed.length > 0) {
    nextActions.push(`Retry failed steps: ${failed.map((o) => o.stepKey).join(", ")}`);
  }
  if (!achieved) {
    nextActions.push(`Escalate goal "${plan.goal}" to human supervisor — success rate ${Math.round(successRate * 100)}%`);
  }

  const summary = achieved
    ? `Goal "${plan.goal}" achieved: ${succeeded.length}/${outcomes.length} steps succeeded (${Math.round(successRate * 100)}%).`
    : `Goal "${plan.goal}" not achieved: only ${succeeded.length}/${outcomes.length} steps succeeded (${Math.round(successRate * 100)}%). ${nextActions.join(" ")}`;

  return {
    planId: plan.planId,
    achieved,
    successRate,
    summary,
    failedSteps,
    nextActions,
    reflectedAt: new Date().toISOString(),
  };
}
