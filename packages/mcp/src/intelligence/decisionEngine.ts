import type {
  BusinessDecision,
  DecisionType,
  DecisionOption,
  DecisionImpact,
  DecisionImpactLevel,
  BusinessRecommendation,
  BusinessConstraint,
  BusinessHealth,
  BusinessDNA,
} from "@boss/types";

export interface DecisionContext {
  orgId: string;
  businessId: string;
  health: BusinessHealth;
  dna: BusinessDNA | null;
  recommendations: BusinessRecommendation[];
  constraints: BusinessConstraint[];
  businessGoals?: string[];
}

export interface GeneratedDecision {
  decisionType: DecisionType;
  objective: string;
  context: string;
  supportingRecommendationIds: string[];
  supportingConstraintIds: string[];
  appliedPolicyKeys: string[];
  options: DecisionOption[];
  selectedOptionKey: string | null;
  expectedImpact: DecisionImpact;
  expectedRoi: number;
  expectedCost: number;
  confidenceScore: number;
}

const HEALTH_POLICY_THRESHOLD = 40;
const CASH_CONSTRAINT_KEYS = ["cash_flow_pressure", "revenue_decline", "high_debt_burden"];
const CAPACITY_CONSTRAINT_KEYS = ["operational_capacity", "staffing_shortage", "team_overload"];

function inferDecisionType(recommendations: BusinessRecommendation[]): DecisionType {
  if (recommendations.length === 0) return "operational";
  const categories = recommendations.map((r) => r.category);
  if (categories.includes("growth") || categories.includes("sales")) return "strategic";
  if (categories.includes("finance")) return "financial";
  if (categories.includes("marketing")) return "marketing";
  if (categories.includes("operations")) return "operational";
  if (categories.includes("technology")) return "technology";
  return "operational";
}

function impactLevelFromScore(score: number): DecisionImpactLevel {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 25) return "low";
  return "low";
}

function deriveAppliedPolicies(
  health: BusinessHealth,
  constraints: BusinessConstraint[]
): string[] {
  const policies: string[] = [];
  const activeConstraintKeys = constraints
    .filter((c) => c.status === "active" || c.status === "monitoring")
    .map((c) => c.definitionKey);

  if (health.overallScore < HEALTH_POLICY_THRESHOLD) {
    policies.push("health.minimum_score_required");
  }
  if (CASH_CONSTRAINT_KEYS.some((k) => activeConstraintKeys.includes(k))) {
    policies.push("finance.cash_reserves_below_target");
  }
  if (CAPACITY_CONSTRAINT_KEYS.some((k) => activeConstraintKeys.includes(k))) {
    policies.push("operations.capacity_exceeded");
  }
  return policies;
}

function buildOptions(recommendations: BusinessRecommendation[]): DecisionOption[] {
  return recommendations.slice(0, 3).map((rec, idx) => ({
    key: `option_${idx + 1}`,
    label: rec.title,
    description: rec.description,
    expectedRoi: rec.estimatedRoi.profitImpactAnnual,
    expectedCost: rec.estimatedCost,
    expectedRisk: (rec.difficulty === "high" ? "high" : rec.difficulty === "medium" ? "medium" : "low") as DecisionImpactLevel,
    confidence: rec.confidence,
    tradeoffs: [
      `Effort: ${rec.estimatedEffortHours}h`,
      `Timeline: ${rec.estimatedTimeToValueDays} days`,
    ],
    estimatedTimelineDays: rec.estimatedTimeToValueDays,
  }));
}

function selectBestOption(options: DecisionOption[], appliedPolicies: string[]): string | null {
  if (options.length === 0) return null;
  const isCashConstrained = appliedPolicies.includes("finance.cash_reserves_below_target");

  const scored = options.map((opt) => {
    let score = opt.confidence * 0.4 + (opt.expectedRoi / Math.max(1, opt.expectedCost)) * 0.3;
    if (isCashConstrained) score -= opt.expectedCost * 0.0001;
    const riskPenalty = { low: 0, medium: -5, high: -10, critical: -20 };
    score += riskPenalty[opt.expectedRisk] ?? 0;
    return { key: opt.key, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.key ?? null;
}

/**
 * Pure deterministic decision derivation (Law 1: MCP owns intelligence).
 * Consumes health + constraints + recommendations → produces a structured Decision.
 * No execution occurs here — Loop Runtime handles that.
 */
export function generateDecision(ctx: DecisionContext): GeneratedDecision {
  const activeConstraints = ctx.constraints.filter(
    (c) => c.status === "active" || c.status === "monitoring"
  );
  const appliedPolicies = deriveAppliedPolicies(ctx.health, activeConstraints);
  const decisionType = inferDecisionType(ctx.recommendations);

  const supportingRecommendationIds = ctx.recommendations.map((r) => r.id);
  const supportingConstraintIds = activeConstraints.map((c) => c.id);

  const options = buildOptions(ctx.recommendations);
  const selectedOptionKey = selectBestOption(options, appliedPolicies);

  const selectedRec = ctx.recommendations.find(
    (r) => options.find((o) => o.key === selectedOptionKey)?.label === r.title
  ) ?? ctx.recommendations[0];

  const expectedRoi = selectedRec?.estimatedRoi.profitImpactAnnual ?? 0;
  const expectedCost = selectedRec?.estimatedCost ?? 0;
  const confidenceScore = selectedRec?.confidence ?? 0;

  const expectedImpact: DecisionImpact = {
    revenueImpact: selectedRec?.estimatedRoi.revenueIncreaseAnnual ?? 0,
    costImpact: expectedCost,
    profitImpact: expectedRoi - expectedCost,
    operationalImpact: impactLevelFromScore(ctx.health.overallScore),
    customerImpact: impactLevelFromScore(ctx.health.overallScore),
    riskLevel: appliedPolicies.length > 1 ? "high" : appliedPolicies.length === 1 ? "medium" : "low",
    affectedDomains: [...new Set(ctx.recommendations.flatMap((r) => r.relatedCapabilities))].slice(0, 5),
    estimatedTimelineDays: selectedRec?.estimatedTimeToValueDays ?? 30,
  };

  const objective = ctx.recommendations.length > 0
    ? `Improve business performance by addressing ${activeConstraints.length} active constraint(s) through ${ctx.recommendations.length} targeted action(s)`
    : "Maintain operational stability and monitor business health";

  const contextText = `Business health score: ${ctx.health.overallScore.toFixed(1)}. ` +
    `Active constraints: ${activeConstraints.length}. ` +
    `Applied policies: ${appliedPolicies.join(", ") || "none"}.`;

  return {
    decisionType,
    objective,
    context: contextText,
    supportingRecommendationIds,
    supportingConstraintIds,
    appliedPolicyKeys: appliedPolicies,
    options,
    selectedOptionKey,
    expectedImpact,
    expectedRoi,
    expectedCost,
    confidenceScore,
  };
}

export function evaluateDecisionHealth(decision: BusinessDecision): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (decision.confidenceScore < 0.5) {
    issues.push("Low confidence score — insufficient evidence");
    recommendations.push("Gather more business data before executing");
  }
  if (decision.expectedRoi <= 0) {
    issues.push("Negative or zero expected ROI");
    recommendations.push("Re-evaluate financial projections");
  }
  if (decision.expectedImpact.riskLevel === "critical") {
    issues.push("Critical risk level");
    recommendations.push("Executive review required before approval");
  }
  if (decision.options.length === 0) {
    issues.push("No decision options available");
    recommendations.push("Generate recommendations first");
  }

  const score = Math.max(0, 100 - issues.length * 20);
  return { score, issues, recommendations };
}
