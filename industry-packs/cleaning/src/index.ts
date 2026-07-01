import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const CLEANING_PACK_VERSION = "0.1.0";

export const CLEANING_INDUSTRIES = [
  "cleaning",
  "janitorial",
  "maid_service",
  "commercial_cleaning",
  "carpet_cleaning",
  "window_cleaning",
  "pressure_washing",
] as const;

export type CleaningIndustry = (typeof CLEANING_INDUSTRIES)[number];

let installed = false;

export function installCleaningPack(): void {
  if (installed) return;
  installed = true;
  seedKpis();
  seedWorkflows();
  seedDecisions();
  seedAiEmployees();
  seedConstraints();
  seedPlaybooks();
  seedMri();
  seedIntegrations();
  seedWorkspace();
}

export function isCleaningIndustry(industry: string): industry is CleaningIndustry {
  return CLEANING_INDUSTRIES.includes(industry as CleaningIndustry);
}
