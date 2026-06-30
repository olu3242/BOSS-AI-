import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type MilestoneType = "kickoff" | "midpoint" | "completion" | "review" | "measurement";

export interface PlanMilestone {
  key: string;
  label: string;
  type: MilestoneType;
  dayOffset: number;
  successCriteria: string;
}

export interface PlanningEntry extends RegistryEntry {
  description: string;
  decisionCategory: string;
  defaultDurationDays: number;
  milestones: PlanMilestone[];
  defaultOwnerRole: string;
  requiredCapabilityKeys: string[];
  rollbackStrategyTemplate: string;
}

export const planningRegistry = createRegistry<PlanningEntry>();
