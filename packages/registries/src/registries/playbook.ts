import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type PlaybookTrigger =
  | "health_score_below_threshold"
  | "constraint_detected"
  | "recommendation_approved"
  | "decision_approved"
  | "kpi_below_target"
  | "manual";

export interface PlaybookStep {
  order: number;
  action: string;
  owner: string;
  expectedOutcome: string;
  timelineHours: number;
}

export interface PlaybookEntry extends RegistryEntry {
  description: string;
  trigger: PlaybookTrigger;
  triggerCondition: string;
  steps: PlaybookStep[];
  relatedDecisionKeys: string[];
  estimatedTotalHours: number;
}

export const playbookRegistry = createRegistry<PlaybookEntry>();
