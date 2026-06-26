import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type ConstraintCategoryKey =
  | "sales"
  | "marketing"
  | "operations"
  | "scheduling"
  | "finance"
  | "customer_experience"
  | "communication"
  | "reporting"
  | "staff_productivity"
  | "compliance"
  | "technology"
  | "leadership"
  | "growth";

export interface ConstraintCategoryEntry extends RegistryEntry {
  categoryKey: ConstraintCategoryKey;
  label: string;
  description: string;
}

export const constraintCategoryRegistry = createRegistry<ConstraintCategoryEntry>();
