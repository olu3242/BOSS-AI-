import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type LearningPatternType =
  | "success_pattern"
  | "failure_pattern"
  | "timing_pattern"
  | "resource_pattern"
  | "seasonal_pattern";

export interface LearningEntry extends RegistryEntry {
  description: string;
  patternType: LearningPatternType;
  detectionCondition: string;
  minOccurrences: number;
  memoryKey: string;
  actionableInsight: string;
  retentionDays: number | null;
}

export const learningRegistry = createRegistry<LearningEntry>();
