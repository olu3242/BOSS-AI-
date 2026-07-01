import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type ApprovalEntityType = "decision" | "recommendation" | "workflow" | "tool_request";

export type ApprovalUrgency = "low" | "medium" | "high" | "critical";

export interface ApprovalSlaConfig {
  urgency: ApprovalUrgency;
  respondWithinHours: number;
  escalateAfterHours: number;
  notifyOwnerOnEscalation: boolean;
}

export interface ApprovalEntry extends RegistryEntry {
  description: string;
  entityType: ApprovalEntityType;
  requiresExecutiveBrief: boolean;
  allowBatchApproval: boolean;
  slaConfigs: ApprovalSlaConfig[];
  defaultUrgency: ApprovalUrgency;
  autoRejectAfterDays: number | null;
}

export const approvalRegistry = createRegistry<ApprovalEntry>();
