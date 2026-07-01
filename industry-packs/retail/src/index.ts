import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const RETAIL_PACK_VERSION = "0.1.0";

export const RETAIL_INDUSTRIES = [
  "retail",
  "specialty_retail",
  "fashion_retail",
  "grocery",
  "convenience_store",
  "sporting_goods",
  "home_goods",
] as const;

export type RetailIndustry = (typeof RETAIL_INDUSTRIES)[number];

let installed = false;

export function installRetailPack(): void {
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

export function isRetailIndustry(industry: string): industry is RetailIndustry {
  return RETAIL_INDUSTRIES.includes(industry as RetailIndustry);
}
