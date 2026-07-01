import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type AutomationTriggerType =
  | "constraint_detected"
  | "recommendation_generated"
  | "decision_approved"
  | "health_score_drop"
  | "kpi_threshold"
  | "scheduled";

export type AutomationActionType =
  | "run_operating_loop"
  | "generate_decision"
  | "send_notification"
  | "execute_tool"
  | "create_workflow";

export interface AutomationRuleStep {
  triggerType: AutomationTriggerType;
  triggerCondition: string;
  actionType: AutomationActionType;
  actionConfig: Record<string, string | number | boolean>;
}

export interface AutomationCenterEntry extends RegistryEntry {
  description: string;
  category: string;
  ruleSteps: AutomationRuleStep[];
  requiresApproval: boolean;
  estimatedTimeSavedMinutesPerWeek: number;
  relatedProviderKeys: string[];
}

export const automationCenterRegistry = createRegistry<AutomationCenterEntry>();
