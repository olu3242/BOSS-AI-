import { seedKpis } from "./data/kpis.js";
import { seedWorkflows } from "./data/workflows.js";
import { seedDecisions } from "./data/decisions.js";
import { seedAiEmployees } from "./data/aiEmployees.js";
import { seedConstraints } from "./data/constraints.js";
import { seedPlaybooks } from "./data/playbooks.js";
import { seedMri } from "./data/mri.js";
import { seedIntegrations } from "./data/integrations.js";
import { seedWorkspace } from "./data/workspace.js";

export const COFFEE_SHOP_PACK_VERSION = "0.1.0";

export const COFFEE_SHOP_INDUSTRIES = [
  "coffee_shop",
  "cafe",
  "espresso_bar",
  "drive_thru_coffee",
  "bakery_cafe",
  "tea_house",
] as const;

export type CoffeeShopIndustry = (typeof COFFEE_SHOP_INDUSTRIES)[number];

let installed = false;

export function installCoffeeShopPack(): void {
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

export function isCoffeeShopIndustry(industry: string): industry is CoffeeShopIndustry {
  return COFFEE_SHOP_INDUSTRIES.includes(industry as CoffeeShopIndustry);
}
