import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type InsightCategory =
  | "performance"
  | "risk"
  | "opportunity"
  | "health"
  | "growth"
  | "efficiency";

export type InsightSeverity = "info" | "warning" | "critical";

export interface InsightEntry extends RegistryEntry {
  description: string;
  category: InsightCategory;
  severity: InsightSeverity;
  relatedKpiKeys: string[];
  actionable: boolean;
  recommendationDefinitionKey?: string;
}

export const insightRegistry = createRegistry<InsightEntry>();
