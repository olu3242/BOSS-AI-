import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type KpiFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually";

export interface KpiEntry extends RegistryEntry {
  description: string;
  formulaPlaceholder: string;
  owner: string;
  measurementFrequency: KpiFrequency;
  targetRange: string;
}

export interface KpiTargetRange {
  min: number;
  max: number;
  unit: string;
}

export type KpiRegistration = Omit<KpiEntry, "targetRange"> & {
  targetRange: string | KpiTargetRange;
};

const registry = createRegistry<KpiEntry>();

export const kpiRegistry = {
  list: registry.list,
  get: registry.get,
  register(entry: KpiRegistration): void {
    registry.register({
      ...entry,
      targetRange:
        typeof entry.targetRange === "string"
          ? entry.targetRange
          : `${entry.targetRange.min}-${entry.targetRange.max} ${entry.targetRange.unit}`,
    });
  },
};
