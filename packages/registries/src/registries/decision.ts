import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type DecisionSeverityLevel = "low" | "medium" | "high" | "critical";
export type DecisionCategoryKey =
  | "strategic"
  | "operational"
  | "financial"
  | "marketing"
  | "technology"
  | "people"
  | "customer";

export type ApprovalPolicy = "auto" | "owner" | "board" | "executive_team";

export interface DecisionOption {
  key: string;
  label: string;
  thresholdCondition: string;
}

export interface DecisionEntry extends RegistryEntry {
  description: string;
  category: DecisionCategoryKey;
  defaultSeverity: DecisionSeverityLevel;
  approvalPolicy: ApprovalPolicy;
  relatedConstraintDefinitionKeys: string[];
  relatedKpiKeys: string[];
  playbook?: string;
  estimatedTimelineDays: number;
}

export const decisionRegistry = createRegistry<DecisionEntry>();
