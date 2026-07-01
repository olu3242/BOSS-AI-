import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type ForecastDomain =
  | "revenue"
  | "cash_flow"
  | "churn"
  | "pipeline"
  | "capacity"
  | "demand"
  | "operational"
  | "growth";

export interface ForecastEntry extends RegistryEntry {
  description: string;
  domain: ForecastDomain;
  periodOptions: string[];
  primaryInputs: string[];
  confidenceRange: { min: number; max: number };
  relatedKpiKeys: string[];
}

export const forecastRegistry = createRegistry<ForecastEntry>();
