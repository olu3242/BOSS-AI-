import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type HealthDimensionKey =
  | "sales"
  | "marketing"
  | "operations"
  | "financial"
  | "customer_experience"
  | "team_productivity"
  | "technology"
  | "growth"
  | "ai_readiness"
  | "overall";

export interface HealthDimensionEntry extends RegistryEntry {
  dimensionKey: HealthDimensionKey;
  label: string;
  description: string;
  weight: number;
}

export const healthDimensionRegistry = createRegistry<HealthDimensionEntry>();
