import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const ACCOUNTING_PACK_VERSION = "0.1.0";

export const ACCOUNTING_INDUSTRIES = [
  "accounting",
  "bookkeeping",
  "cpa",
  "tax_preparation",
  "payroll_services",
  "advisory",
] as const;

export type AccountingIndustry = (typeof ACCOUNTING_INDUSTRIES)[number];

let installed = false;

export function installAccountingPack(): void {
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

export function isAccountingIndustry(industry: string): industry is AccountingIndustry {
  return ACCOUNTING_INDUSTRIES.includes(industry as AccountingIndustry);
}
