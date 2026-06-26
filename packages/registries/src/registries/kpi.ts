import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type KpiFrequency = "daily" | "weekly" | "monthly" | "quarterly";

export interface KpiEntry extends RegistryEntry {
  description: string;
  formulaPlaceholder: string;
  owner: string;
  measurementFrequency: KpiFrequency;
  targetRange: string;
}

export const kpiRegistry = createRegistry<KpiEntry>();
