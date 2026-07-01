/**
 * Home Services Industry Pack — RC2.1
 *
 * Extends the BOSS platform for HVAC, Plumbing, Electrical, Garage Door,
 * and Appliance Repair businesses. Purely declarative — populates existing
 * registries with no changes to the core platform.
 *
 * Install order: general-smb pack first, then this pack.
 */
import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const HOME_SERVICES_PACK_VERSION = "0.1.0";

export const HOME_SERVICES_INDUSTRIES = [
  "hvac",
  "plumbing",
  "electrical",
  "garage_door",
  "appliance_repair",
  "home_services",
] as const;

export type HomeServicesIndustry = (typeof HOME_SERVICES_INDUSTRIES)[number];

let installed = false;

export function installHomeServicesPack(): void {
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

export function isHomeServicesIndustry(industry: string): industry is HomeServicesIndustry {
  return HOME_SERVICES_INDUSTRIES.includes(industry as HomeServicesIndustry);
}
