/**
 * Core Business Capability Pack (general-smb).
 * Reusable capabilities, constraints, KPIs, workflows, AI employees and
 * prompts for any local small business — installed into the shared
 * @boss/registries layer. Nothing here is industry-specific; vertical
 * packs (dental, legal, etc.) layer on top of this one.
 */
import { seedCapabilities } from "./data/capabilities.js";
import { seedConstraints } from "./data/constraints.js";
import { seedKpis } from "./data/kpis.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedPrompts } from "./data/prompts.js";
import { seedMri } from "./data/mri.js";
import { seedDnaDimensions } from "./data/dna.js";
import { seedHealthDimensions } from "./data/health.js";
import { seedPainPoints } from "./data/painPoints.js";
import { seedGoalOptions } from "./data/goalOptions.js";
import { seedConstraintCategories } from "./data/constraintCategories.js";
import { seedConstraintLibrary } from "./data/constraintLibrary.js";
import { seedRecommendationCategories } from "./data/recommendationCategories.js";
import { seedRecommendationLibrary } from "./data/recommendationLibrary.js";
import { seedToolFabric } from "./data/toolFabric.js";
import { seedDecisions } from "./data/decisions.js";
import { seedForecasts } from "./data/forecasts.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedBusinessRules } from "./data/businessRules.js";
import { seedOperatingLoops } from "./data/operatingLoops.js";
import { seedPlannings } from "./data/plannings.js";
import { seedVerifications } from "./data/verifications.js";
import { seedOptimizations } from "./data/optimizations.js";
import { seedLearnings } from "./data/learnings.js";

export const GENERAL_SMB_PACK_VERSION = "0.7.0";

let installed = false;

export function installGeneralSmbPack(): void {
  if (installed) {
    return;
  }
  installed = true;
  seedCapabilities();
  seedConstraints();
  seedKpis();
  seedAiEmployees();
  seedWorkflows();
  seedPrompts();
  seedMri();
  seedDnaDimensions();
  seedHealthDimensions();
  seedPainPoints();
  seedGoalOptions();
  seedConstraintCategories();
  seedConstraintLibrary();
  seedRecommendationCategories();
  seedRecommendationLibrary();
  seedToolFabric();
  seedDecisions();
  seedForecasts();
  seedPlaybooks();
  seedBusinessRules();
  seedOperatingLoops();
  seedPlannings();
  seedVerifications();
  seedOptimizations();
  seedLearnings();
}

export {
  seedCapabilities,
  seedConstraints,
  seedKpis,
  seedAiEmployees,
  seedWorkflows,
  seedPrompts,
  seedMri,
  seedDnaDimensions,
  seedHealthDimensions,
  seedPainPoints,
  seedGoalOptions,
  seedConstraintCategories,
  seedConstraintLibrary,
  seedRecommendationCategories,
  seedRecommendationLibrary,
  seedToolFabric,
  seedDecisions,
  seedForecasts,
  seedPlaybooks,
  seedBusinessRules,
  seedOperatingLoops,
  seedPlannings,
  seedVerifications,
  seedOptimizations,
  seedLearnings,
};
