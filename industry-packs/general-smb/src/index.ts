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
import { seedAgents } from "./data/agents.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedTriggers } from "./data/triggers.js";
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
import { seedExecutionArchitecture } from "./data/executionArchitecture.js";
import { seedGovernanceCertification } from "./data/governanceCertification.js";
import { seedCoreRegistries } from "@boss/registries";

export { GENERAL_SMB_PACK_VERSION } from "./version.js";

let installed = false;

export function installGeneralSmbPack(): void {
  if (installed) {
    return;
  }
  installed = true;
  seedCoreRegistries();
  seedCapabilities();
  seedConstraints();
  seedKpis();
  seedAiEmployees();
  seedAgents();
  seedWorkflows();
  seedTriggers();
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
  seedExecutionArchitecture();
  seedGovernanceCertification();
}

export {
  seedCapabilities,
  seedConstraints,
  seedKpis,
  seedAiEmployees,
  seedAgents,
  seedWorkflows,
  seedTriggers,
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
  seedExecutionArchitecture,
  seedGovernanceCertification,
};
