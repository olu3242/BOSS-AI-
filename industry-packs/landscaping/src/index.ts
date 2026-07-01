import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const LANDSCAPING_PACK_VERSION = "0.1.0";

export const LANDSCAPING_INDUSTRIES = [
  "landscaping",
  "lawn_care",
  "tree_service",
  "irrigation",
  "snow_removal",
  "hardscaping",
] as const;

export type LandscapingIndustry = (typeof LANDSCAPING_INDUSTRIES)[number];

let installed = false;

export function installLandscapingPack(): void {
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

export function isLandscapingIndustry(industry: string): industry is LandscapingIndustry {
  return LANDSCAPING_INDUSTRIES.includes(industry as LandscapingIndustry);
}
