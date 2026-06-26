import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type RecommendationCategoryKey =
  | "sales"
  | "marketing"
  | "operations"
  | "customer_experience"
  | "finance"
  | "scheduling"
  | "communication"
  | "reporting"
  | "technology"
  | "leadership"
  | "growth"
  | "compliance"
  | "productivity";

export interface RecommendationCategoryEntry extends RegistryEntry {
  categoryKey: RecommendationCategoryKey;
  label: string;
  description: string;
}

export const recommendationCategoryRegistry = createRegistry<RecommendationCategoryEntry>();
