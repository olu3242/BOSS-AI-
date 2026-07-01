import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const DENTAL_PACK_VERSION = "0.1.0";

export const DENTAL_INDUSTRIES = [
  "dental",
  "dentistry",
  "dental_practice",
  "orthodontics",
  "oral_surgery",
  "periodontics",
] as const;

export type DentalIndustry = (typeof DENTAL_INDUSTRIES)[number];

let installed = false;

export function installDentalPack(): void {
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

export function isDentalIndustry(industry: string): industry is DentalIndustry {
  return DENTAL_INDUSTRIES.includes(industry as DentalIndustry);
}
