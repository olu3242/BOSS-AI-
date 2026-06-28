import type {
  BusinessDiagnosticReport,
  DiagnosticAnalysisInput,
  DiagnosticArea,
  DiagnosticAreaScore,
  DiagnosticEvidence,
  DiagnosticMaturityArea,
  DiagnosticMaturityAssessment,
  DiagnosticOpportunity,
  DiagnosticOpportunityType,
  DiagnosticPriorityItem,
  DiagnosticRootCause,
  DiagnosticWeightProfile,
  HealthDimensionKey,
} from "@boss/types";

export const DEFAULT_DIAGNOSTIC_WEIGHT_PROFILE: DiagnosticWeightProfile =
  Object.freeze({
    id: "general_smb",
    version: "1.0.0",
    weights: Object.freeze({
      operations: 1,
      customers: 1,
      sales: 1,
      marketing: 0.8,
      finance: 1,
      team: 0.8,
      productivity: 0.8,
      technology: 0.7,
      processes: 0.9,
      ai_readiness: 0.4,
      automation_readiness: 0.6,
      growth_readiness: 0.8,
    }),
  });

const areas: readonly DiagnosticArea[] = Object.freeze([
  "operations",
  "customers",
  "sales",
  "marketing",
  "finance",
  "team",
  "productivity",
  "technology",
  "processes",
  "ai_readiness",
  "automation_readiness",
  "growth_readiness",
]);

const maturityValue = {
  absent: 0,
  ad_hoc: 25,
  developing: 50,
  managed: 75,
  optimized: 100,
} as const;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: readonly number[], fallback = 0): number {
  return values.length === 0
    ? fallback
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function healthKey(area: DiagnosticArea): HealthDimensionKey | undefined {
  const keys: Partial<Record<DiagnosticArea, HealthDimensionKey>> = {
    operations: "operations",
    customers: "customer_experience",
    sales: "sales",
    marketing: "marketing",
    finance: "financial",
    team: "team_productivity",
    productivity: "team_productivity",
    technology: "technology",
    ai_readiness: "ai_readiness",
    growth_readiness: "growth",
  };
  return keys[area];
}

function constraintArea(category: string): DiagnosticArea {
  const mapping: Record<string, DiagnosticArea> = {
    customer_experience: "customers",
    staff_productivity: "productivity",
    leadership: "team",
    scheduling: "operations",
    communication: "customers",
    reporting: "processes",
    compliance: "processes",
    growth: "growth_readiness",
  };
  return mapping[category] ?? (areas.includes(category as DiagnosticArea)
    ? category as DiagnosticArea
    : "operations");
}

function recommendationArea(category: string): DiagnosticArea {
  const mapping: Record<string, DiagnosticArea> = {
    customer_experience: "customers",
    productivity: "productivity",
    leadership: "team",
    scheduling: "operations",
    communication: "customers",
    reporting: "processes",
    compliance: "processes",
    growth: "growth_readiness",
  };
  return mapping[category] ?? (areas.includes(category as DiagnosticArea)
    ? category as DiagnosticArea
    : "operations");
}

function scoreArea(
  area: DiagnosticArea,
  input: DiagnosticAnalysisInput,
): {
  score: number;
  confidence: number;
  trend: DiagnosticAreaScore["trend"];
  evidence: DiagnosticEvidence[];
} {
  const key = healthKey(area);
  const health = input.healthDimensions.find(
    (dimension) => dimension.dimensionKey === key,
  );
  if (health) {
    return {
      score: health.score,
      confidence: health.confidence,
      trend: health.trend,
      evidence: health.evidence.map((description) => ({
        source: "business_health",
        referenceId: health.id,
        description,
      })),
    };
  }

  const capabilityKeys: Partial<Record<DiagnosticArea, readonly string[]>> = {
    processes: ["operations", "task_management", "reporting"],
    automation_readiness: input.capabilities.map(
      (capability) => capability.capabilityKey,
    ),
  };
  const selected = input.capabilities.filter((capability) =>
    capabilityKeys[area]?.includes(capability.capabilityKey),
  );
  return {
    score: average(
      selected.map((capability) => maturityValue[capability.currentMaturity]),
      0,
    ),
    confidence: selected.length === 0 ? 0.2 : Math.min(0.9, 0.55 + selected.length * 0.08),
    trend: "unknown",
    evidence: selected.map((capability) => ({
      source: "capability_assessment",
      referenceId: capability.id,
      description: `${capability.capabilityKey} maturity is ${capability.currentMaturity}.`,
    })),
  };
}

function improvementFor(
  area: DiagnosticArea,
  input: DiagnosticAnalysisInput,
): string {
  const priorityById = new Map(
    input.recommendationPriorities.map((priority) => [
      priority.recommendationId,
      priority.rank,
    ]),
  );
  const recommendation = input.recommendations
    .filter(
      (candidate) =>
        recommendationArea(candidate.category) === area &&
        candidate.evidence.length > 0,
    )
    .sort(
      (left, right) =>
        (priorityById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (priorityById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    )[0];
  return recommendation?.title ?? "Collect more evidence before selecting an improvement.";
}

function buildAreaScores(
  input: DiagnosticAnalysisInput,
  profile: DiagnosticWeightProfile,
): readonly DiagnosticAreaScore[] {
  return Object.freeze(
    areas.map((area) => {
      const result = scoreArea(area, input);
      const desiredScore = 80;
      const gap = clamp(desiredScore - result.score);
      const weight = profile.weights[area];
      return Object.freeze({
        area,
        currentScore: clamp(result.score),
        desiredScore,
        gap,
        trend: result.trend,
        confidence: result.confidence,
        businessImpact: clamp(gap * weight),
        priority: clamp(gap * weight * result.confidence),
        evidence: Object.freeze(result.evidence),
        recommendedImprovement: improvementFor(area, input),
      });
    }),
  );
}

function buildRootCauses(
  input: DiagnosticAnalysisInput,
): readonly DiagnosticRootCause[] {
  const rankById = new Map(
    input.constraintPriorities.map((priority) => [
      priority.constraintId,
      priority.rank,
    ]),
  );
  return Object.freeze(
    [...input.constraints]
      .sort(
        (left, right) =>
          (rankById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (rankById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
      )
      .map((constraint, index) =>
        Object.freeze({
          id: constraint.id,
          constraintId: constraint.id,
          area: constraintArea(constraint.category),
          kind:
            constraint.severity === "critical"
              ? "blocker"
              : index < 3
                ? "primary"
                : constraint.dependencies.length > 0
                  ? "contributing"
                  : "risk",
          title: constraint.title,
          description: constraint.description,
          businessImpact: constraint.businessImpact,
          confidence: constraint.confidence,
          dependencies: Object.freeze([...constraint.dependencies]),
          evidence: Object.freeze(
            constraint.evidence.map((evidence) => ({
              source: "constraint_analysis" as const,
              referenceId: constraint.id,
              description: evidence.description,
            })),
          ),
        }),
      ),
  );
}

function opportunityType(
  recommendation: DiagnosticAnalysisInput["recommendations"][number],
): DiagnosticOpportunityType {
  if (recommendation.stage === "quick_wins") return "quick_win";
  if (recommendation.estimatedRoi.revenueIncreaseAnnual > 0) return "revenue_growth";
  if (
    recommendation.estimatedRoi.administrativeReductionHours > 0 ||
    recommendation.estimatedRoi.timeSavedHoursWeekly > 0
  ) {
    return "cost_reduction";
  }
  if (recommendation.relatedCapabilities.length > 0) return "automation_candidate";
  if (recommendation.category === "technology") return "ai_delegation_candidate";
  return "high_impact";
}

function buildOpportunities(
  input: DiagnosticAnalysisInput,
): readonly DiagnosticOpportunity[] {
  const rankById = new Map(
    input.recommendationPriorities.map((priority) => [
      priority.recommendationId,
      priority.rank,
    ]),
  );
  return Object.freeze(
    input.recommendations
      .filter((recommendation) => recommendation.evidence.length > 0)
      .map((recommendation) => {
        const effort = { low: 25, medium: 60, high: 90 }[recommendation.difficulty];
        const impact = clamp(
          recommendation.estimatedRoi.profitImpactAnnual / 1_000 +
            recommendation.estimatedRoi.timeSavedHoursWeekly * 4 +
            recommendation.estimatedRoi.revenueIncreaseAnnual / 2_000,
        );
        const rank = rankById.get(recommendation.id) ?? 100;
        return Object.freeze({
          id: recommendation.id,
          recommendationId: recommendation.id,
          type: opportunityType(recommendation),
          title: recommendation.title,
          description: recommendation.description,
          expectedImpact: impact,
          effort,
          confidence: recommendation.confidence,
          priority: clamp(105 - rank * 5),
          evidence: Object.freeze(
            recommendation.evidence.map((evidence) => ({
              source: "recommendation_analysis" as const,
              referenceId: recommendation.id,
              description: evidence.description,
            })),
          ),
        });
      })
      .sort((left, right) => right.priority - left.priority),
  );
}

function levelFor(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  return 1;
}

function maturityScore(
  area: DiagnosticMaturityArea,
  areaScores: readonly DiagnosticAreaScore[],
  input: DiagnosticAnalysisInput,
): DiagnosticMaturityAssessment {
  const areaMap: Record<DiagnosticMaturityArea, readonly DiagnosticArea[]> = {
    leadership: ["team", "growth_readiness"],
    operations: ["operations", "processes"],
    sales: ["sales"],
    customer_experience: ["customers"],
    financial_discipline: ["finance"],
    technology: ["technology"],
    automation: ["automation_readiness"],
    data: ["processes", "technology"],
    ai_adoption: ["ai_readiness"],
  };
  const selected = areaScores.filter((score) => areaMap[area].includes(score.area));
  const score = clamp(average(selected.map((entry) => entry.currentScore)));
  const confidence = average(selected.map((entry) => entry.confidence), 0.2);
  const evidence = selected.flatMap((entry) => entry.evidence);
  return Object.freeze({
    area,
    level: levelFor(score),
    score,
    rationale: `${area.replaceAll("_", " ")} is at maturity level ${levelFor(score)} based on ${evidence.length} evidence item(s).`,
    confidence,
    evidence: Object.freeze(
      evidence.length > 0
        ? evidence
        : input.capabilities.slice(0, 1).map((capability) => ({
            source: "capability_assessment" as const,
            referenceId: capability.id,
            description: "Fallback capability evidence was used.",
          })),
    ),
  });
}

function buildPriorities(
  rootCauses: readonly DiagnosticRootCause[],
  opportunities: readonly DiagnosticOpportunity[],
): readonly DiagnosticPriorityItem[] {
  const items = [
    ...rootCauses.map((root) => ({
      sourceType: "root_cause" as const,
      sourceId: root.id,
      impact: root.kind === "blocker" ? 100 : root.kind === "primary" ? 85 : 60,
      urgency: root.kind === "blocker" ? 100 : 75,
      effort: 50,
      confidence: root.confidence,
    })),
    ...opportunities.map((opportunity) => ({
      sourceType: "opportunity" as const,
      sourceId: opportunity.id,
      impact: opportunity.expectedImpact,
      urgency: opportunity.priority,
      effort: opportunity.effort,
      confidence: opportunity.confidence,
    })),
  ].map((item) => ({
    ...item,
    score: clamp(
      (item.impact * 0.4 +
        item.urgency * 0.3 +
        (100 - item.effort) * 0.15) *
        item.confidence,
    ),
  }));
  return Object.freeze(
    items
      .sort((left, right) => right.score - left.score)
      .map((item, index) => Object.freeze({ ...item, rank: index + 1 })),
  );
}

export function deriveBusinessDiagnostic(
  input: DiagnosticAnalysisInput,
  profile: DiagnosticWeightProfile = DEFAULT_DIAGNOSTIC_WEIGHT_PROFILE,
): BusinessDiagnosticReport {
  const areaScores = buildAreaScores(input, profile);
  const rootCauses = buildRootCauses(input);
  const opportunities = buildOpportunities(input);
  const maturityAreas: readonly DiagnosticMaturityArea[] = [
    "leadership",
    "operations",
    "sales",
    "customer_experience",
    "financial_discipline",
    "technology",
    "automation",
    "data",
    "ai_adoption",
  ];
  const maturity = Object.freeze(
    maturityAreas.map((area) => maturityScore(area, areaScores, input)),
  );
  const priorities = buildPriorities(rootCauses, opportunities);
  const weightedTotal = areaScores.reduce(
    (sum, score) => sum + score.currentScore * profile.weights[score.area],
    0,
  );
  const weightTotal = areaScores.reduce(
    (sum, score) => sum + profile.weights[score.area],
    0,
  );
  const overallHealth = clamp(weightedTotal / weightTotal);
  const confidence = average(areaScores.map((score) => score.confidence), 0);
  const strongest = [...areaScores].sort(
    (left, right) => right.currentScore - left.currentScore,
  );
  const weakest = [...strongest].reverse();
  const quickWins = opportunities.filter((item) => item.type === "quick_win");

  return Object.freeze({
    id: input.reportId,
    orgId: input.orgId,
    businessId: input.businessId,
    businessMriId: input.businessMriId,
    weightProfileId: profile.id,
    weightProfileVersion: profile.version,
    overallHealth,
    confidence,
    areaScores,
    rootCauses,
    opportunities,
    maturity,
    priorities,
    summary: Object.freeze({
      overview: `Business health is ${overallHealth}/100. The diagnostic identified ${rootCauses.length} root-cause finding(s) and ${opportunities.length} evidence-backed improvement opportunity(ies).`,
      topStrengths: Object.freeze(strongest.slice(0, 3).map((item) => item.area.replaceAll("_", " "))),
      topWeaknesses: Object.freeze(weakest.slice(0, 3).map((item) => item.area.replaceAll("_", " "))),
      immediatePriorities: Object.freeze(opportunities.slice(0, 3).map((item) => item.title)),
      thirtyDayFocus: Object.freeze(quickWins.slice(0, 3).map((item) => item.title)),
      mediumTermImprovements: Object.freeze(
        input.recommendations
          .filter((item) => item.stage === "medium_term")
          .slice(0, 3)
          .map((item) => item.title),
      ),
      longTermOpportunities: Object.freeze(
        input.recommendations
          .filter((item) => item.stage === "strategic" || item.stage === "long_term")
          .slice(0, 3)
          .map((item) => item.title),
      ),
    }),
    generatedAt: input.generatedAt,
    version: input.version,
  });
}
