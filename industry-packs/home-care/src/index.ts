import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const HOME_CARE_PACK_VERSION = "0.1.0";

export const HOME_CARE_INDUSTRIES = [
  "home_care",
  "senior_care",
  "in_home_care",
  "companion_care",
  "personal_care",
  "respite_care",
] as const;

export type HomeCareIndustry = (typeof HOME_CARE_INDUSTRIES)[number];

let installed = false;

export function installHomeCarePack(): void {
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

export function isHomeCareIndustry(industry: string): industry is HomeCareIndustry {
  return HOME_CARE_INDUSTRIES.includes(industry as HomeCareIndustry);
}
