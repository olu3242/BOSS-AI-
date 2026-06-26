import type {
  ImpactLevel,
  RecommendationApproval,
  RecommendationCategoryKey,
  RecommendationDifficulty,
  RecommendationEvidenceItem,
  RecommendationPriorityLevel,
  RecommendationRoiEstimate,
  RecommendationStage,
  TransformationRoadmapStageEntry,
} from "@boss/types";
import { recommendationDefinitionRegistry } from "@boss/registries";

const IMPACT_RANK: Record<ImpactLevel, number> = { low: 1, medium: 2, high: 3 };

export interface ActiveConstraintInput {
  id: string;
  definitionKey: string;
}

export interface GeneratedRecommendation {
  definitionKey: string;
  title: string;
  description: string;
  businessGoal: string;
  category: RecommendationCategoryKey;
  relatedCapabilities: string[];
  relatedConstraintIds: string[];
  relatedKpiKeys: string[];
  expectedOutcome: string;
  difficulty: RecommendationDifficulty;
  estimatedEffortHours: number;
  estimatedCost: number;
  estimatedRoi: RecommendationRoiEstimate;
  estimatedTimeToValueDays: number;
  confidence: number;
  evidence: RecommendationEvidenceItem[];
  dependencies: string[];
  approval: RecommendationApproval;
  stage: RecommendationStage;
}

function sizeFactorFor(employeeCount: number): number {
  return Math.max(1, Math.min(3, employeeCount / 5));
}

/**
 * Deterministic, registry-driven recommendation derivation. A recommendation
 * fires when one or more of the business's currently active constraints
 * matches one of the definition's triggerConstraintKeys — never re-derived
 * from raw MRI signals, keeping this layer's reasoning scoped to the
 * constraint graph as the spec requires.
 */
export function generateRecommendations(
  activeConstraints: ActiveConstraintInput[],
  employeeCount: number,
): GeneratedRecommendation[] {
  const constraintsByDefinitionKey = new Map<string, ActiveConstraintInput[]>();
  for (const constraint of activeConstraints) {
    const existing = constraintsByDefinitionKey.get(constraint.definitionKey);
    if (existing) {
      existing.push(constraint);
    } else {
      constraintsByDefinitionKey.set(constraint.definitionKey, [constraint]);
    }
  }

  const sizeFactor = sizeFactorFor(employeeCount);
  const generated: GeneratedRecommendation[] = [];

  for (const definition of recommendationDefinitionRegistry.list()) {
    const matchedConstraints = definition.triggerConstraintKeys.flatMap(
      (key) => constraintsByDefinitionKey.get(key) ?? [],
    );
    if (matchedConstraints.length === 0) {
      continue;
    }

    const evidence: RecommendationEvidenceItem[] = matchedConstraints.map((constraint) => ({
      source: "constraint_analysis",
      description: `Active constraint "${constraint.definitionKey}" triggers this recommendation.`,
      data: { constraintId: constraint.id, definitionKey: constraint.definitionKey },
    }));

    const roiModel = definition.roiModel;
    const estimatedRoi: RecommendationRoiEstimate = {
      revenueIncreaseAnnual: Math.round(roiModel.revenueIncreaseAnnualBase * sizeFactor),
      timeSavedHoursWeekly: roiModel.timeSavedHoursWeeklyBase,
      administrativeReductionHours: roiModel.administrativeReductionHoursBase,
      customerRetentionIncreasePct: roiModel.customerRetentionIncreasePct,
      leadConversionImprovementPct: roiModel.leadConversionImprovementPct,
      profitImpactAnnual: Math.round(roiModel.profitImpactAnnualBase * sizeFactor),
      ownerTimeSavedHoursWeekly: roiModel.ownerTimeSavedHoursWeeklyBase,
      riskReduction: roiModel.riskReduction,
      confidence: Math.min(0.95, 0.6 + matchedConstraints.length * 0.1),
    };

    generated.push({
      definitionKey: definition.definitionKey,
      title: definition.title,
      description: definition.description,
      businessGoal: definition.businessGoal,
      category: definition.category,
      relatedCapabilities: definition.relatedCapabilities,
      relatedConstraintIds: matchedConstraints.map((c) => c.id),
      relatedKpiKeys: definition.relatedKpiKeys,
      expectedOutcome: definition.expectedOutcome,
      difficulty: definition.difficulty,
      estimatedEffortHours: Math.round(definition.estimatedEffortHoursBase * sizeFactor),
      estimatedCost: Math.round(definition.estimatedCostBase * sizeFactor),
      estimatedRoi,
      estimatedTimeToValueDays: definition.estimatedTimeToValueDaysBase,
      confidence: estimatedRoi.confidence,
      evidence,
      dependencies: definition.relatedCapabilities,
      approval: definition.approval,
      stage: definition.stage,
    });
  }

  return generated;
}

export interface RecommendationScoreResult {
  definitionKey: string;
  priorityScore: number;
  businessValueScore: number;
  implementationScore: number;
  strategicScore: number;
  overallScore: number;
  priority: RecommendationPriorityLevel;
  rank: number;
}

const DIFFICULTY_RANK: Record<RecommendationDifficulty, number> = { high: 1, medium: 2, low: 3 };

/**
 * Deterministic weighted scoring: a fixed function of business impact,
 * financial impact, customer impact, implementation difficulty, automation
 * potential, urgency, dependencies, and confidence. No hidden state.
 */
export function prioritizeRecommendations(
  recommendations: GeneratedRecommendation[],
  employeeCount: number,
): RecommendationScoreResult[] {
  const scored = recommendations.map((recommendation) => {
    const businessValueScore = Math.min(
      100,
      (recommendation.estimatedRoi.revenueIncreaseAnnual / Math.max(1000, employeeCount * 5000)) * 100,
    );
    const financialImpactScore = Math.min(100, (recommendation.estimatedRoi.profitImpactAnnual / Math.max(1000, employeeCount * 5000)) * 100);
    const customerImpactScore = recommendation.estimatedRoi.customerRetentionIncreasePct * 10;
    const implementationScore = DIFFICULTY_RANK[recommendation.difficulty] * (100 / 3);
    const automationScore = IMPACT_RANK[recommendation.estimatedRoi.riskReduction] * (100 / 3);
    const dependencyScore = Math.max(0, 100 - recommendation.dependencies.length * 10);
    const confidenceScore = recommendation.confidence * 100;

    const priorityScore =
      businessValueScore * 0.3 +
      financialImpactScore * 0.25 +
      customerImpactScore * 0.15 +
      implementationScore * 0.1 +
      automationScore * 0.1 +
      confidenceScore * 0.1;

    const strategicScore =
      businessValueScore * 0.4 + dependencyScore * 0.3 + automationScore * 0.3;

    const overallScore =
      priorityScore * 0.5 + implementationScore * 0.25 + strategicScore * 0.25;

    return {
      definitionKey: recommendation.definitionKey,
      priorityScore: Math.round(priorityScore),
      businessValueScore: Math.round(businessValueScore),
      implementationScore: Math.round(implementationScore),
      strategicScore: Math.round(strategicScore),
      overallScore: Math.round(overallScore),
    };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);

  return scored.map((score, index) => ({
    ...score,
    priority: priorityForScore(score.overallScore),
    rank: index + 1,
  }));
}

function priorityForScore(score: number): RecommendationPriorityLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "informational";
}

/**
 * Groups recommendation definition keys into the 5 fixed transformation
 * stages, producing the Transformation Roadmap's stage entries.
 */
export function buildTransformationRoadmapStages(
  recommendations: GeneratedRecommendation[],
): TransformationRoadmapStageEntry[] {
  const stages: RecommendationStage[] = ["quick_wins", "short_term", "medium_term", "strategic", "long_term"];
  return stages.map((stage) => ({
    stage,
    recommendationIds: recommendations.filter((r) => r.stage === stage).map((r) => r.definitionKey),
  }));
}
