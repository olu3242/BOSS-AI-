import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type GoalCategory =
  | "growth"
  | "profitability"
  | "customer_experience"
  | "operations"
  | "automation"
  | "staff_productivity";

export interface GoalOptionEntry extends RegistryEntry {
  category: GoalCategory;
  label: string;
}

export const goalOptionRegistry = createRegistry<GoalOptionEntry>();
