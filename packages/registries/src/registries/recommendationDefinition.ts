import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";
import type { RecommendationCategoryKey } from "./recommendationCategory.js";
import type { ImpactLevel } from "./constraintDefinition.js";

export type RecommendationDifficulty = "low" | "medium" | "high";
export type RecommendationStage = "quick_wins" | "short_term" | "medium_term" | "strategic" | "long_term";
export type RecommendationApproval = "auto" | "approval_required" | "executive_review" | "manual_only";

/**
 * Structured ROI base model, scaled deterministically by business size at
 * evaluation time — never invented per-business, always explainable back
 * to this fixed definition.
 */
export interface RecommendationRoiModel {
  revenueIncreaseAnnualBase: number;
  timeSavedHoursWeeklyBase: number;
  administrativeReductionHoursBase: number;
  customerRetentionIncreasePct: number;
  leadConversionImprovementPct: number;
  profitImpactAnnualBase: number;
  ownerTimeSavedHoursWeeklyBase: number;
  riskReduction: ImpactLevel;
}

export interface RecommendationDefinitionEntry extends RegistryEntry {
  definitionKey: string;
  title: string;
  description: string;
  businessGoal: string;
  category: RecommendationCategoryKey;
  /** Recommendation fires when any of the business's active constraints matches one of these definition keys. */
  triggerConstraintKeys: string[];
  relatedCapabilities: string[];
  relatedKpiKeys: string[];
  expectedOutcome: string;
  difficulty: RecommendationDifficulty;
  estimatedEffortHoursBase: number;
  estimatedCostBase: number;
  estimatedTimeToValueDaysBase: number;
  automationPotential: ImpactLevel;
  approval: RecommendationApproval;
  stage: RecommendationStage;
  roiModel: RecommendationRoiModel;
}

export const recommendationDefinitionRegistry = createRegistry<RecommendationDefinitionEntry>();
