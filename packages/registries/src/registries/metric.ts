import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type MetricAggregation = "sum" | "avg" | "count" | "latest" | "max" | "min";

export interface MetricEntry extends RegistryEntry {
  description: string;
  unit: string;
  aggregation: MetricAggregation;
  sourceEventTypes: string[];
  kpiKey?: string;
}

export const metricRegistry = createRegistry<MetricEntry>();
