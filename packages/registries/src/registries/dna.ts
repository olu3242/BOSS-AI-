import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type DnaDimensionKey =
  | "archetype"
  | "growthStage"
  | "operationalComplexity"
  | "technologyMaturity"
  | "automationReadiness"
  | "customerEngagementStyle"
  | "revenueModel"
  | "communicationStyle"
  | "decisionStyle"
  | "riskProfile";

export interface DnaDimensionEntry extends RegistryEntry {
  dimensionKey: DnaDimensionKey;
  label: string;
  possibleValues: string[];
}

export const dnaDimensionRegistry = createRegistry<DnaDimensionEntry>();
