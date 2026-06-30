import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type BusinessRuleType =
  | "threshold"
  | "policy"
  | "compliance"
  | "operational"
  | "financial";

export type RuleAction = "alert" | "block" | "escalate" | "auto_approve" | "require_review";

export interface BusinessRuleEntry extends RegistryEntry {
  description: string;
  ruleType: BusinessRuleType;
  condition: string;
  action: RuleAction;
  severity: "low" | "medium" | "high" | "critical";
  affectedDomains: string[];
  overridable: boolean;
}

export const businessRuleRegistry = createRegistry<BusinessRuleEntry>();
