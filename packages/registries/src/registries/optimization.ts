import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type OptimizationDomain =
  | "workflow_efficiency"
  | "resource_allocation"
  | "automation"
  | "cost_reduction"
  | "revenue_growth"
  | "customer_retention"
  | "team_productivity";

export interface OptimizationEntry extends RegistryEntry {
  description: string;
  domain: OptimizationDomain;
  detectionCondition: string;
  recommendedAction: string;
  estimatedImpactPct: number;
  relatedKpiKeys: string[];
  priority: "low" | "medium" | "high";
}

export const optimizationRegistry = createRegistry<OptimizationEntry>();
