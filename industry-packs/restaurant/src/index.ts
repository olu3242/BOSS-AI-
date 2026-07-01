import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const RESTAURANT_PACK_VERSION = "0.1.0";

export const RESTAURANT_INDUSTRIES = [
  "restaurant",
  "casual_dining",
  "fine_dining",
  "fast_casual",
  "bar_and_grill",
  "cafe",
  "food_truck",
] as const;

export type RestaurantIndustry = (typeof RESTAURANT_INDUSTRIES)[number];

let installed = false;

export function installRestaurantPack(): void {
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

export function isRestaurantIndustry(industry: string): industry is RestaurantIndustry {
  return RESTAURANT_INDUSTRIES.includes(industry as RestaurantIndustry);
}
