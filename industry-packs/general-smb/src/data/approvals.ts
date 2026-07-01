import { approvalRegistry } from "@boss/registries";

export function seedApprovals(): void {
  approvalRegistry.register({
    key: "decision_approval",
    label: "Decision Approval",
    description: "Approval workflow for business decisions before execution planning begins.",
    entityType: "decision",
    requiresExecutiveBrief: true,
    allowBatchApproval: false,
    defaultUrgency: "medium",
    autoRejectAfterDays: 14,
    slaConfigs: [
      { urgency: "low", respondWithinHours: 72, escalateAfterHours: 120, notifyOwnerOnEscalation: true },
      { urgency: "medium", respondWithinHours: 24, escalateAfterHours: 48, notifyOwnerOnEscalation: true },
      { urgency: "high", respondWithinHours: 8, escalateAfterHours: 16, notifyOwnerOnEscalation: true },
      { urgency: "critical", respondWithinHours: 2, escalateAfterHours: 4, notifyOwnerOnEscalation: true },
    ],
  });

  approvalRegistry.register({
    key: "recommendation_approval",
    label: "Recommendation Approval",
    description: "Approval workflow for strategic recommendations before they generate decisions.",
    entityType: "recommendation",
    requiresExecutiveBrief: false,
    allowBatchApproval: true,
    defaultUrgency: "low",
    autoRejectAfterDays: 30,
    slaConfigs: [
      { urgency: "low", respondWithinHours: 168, escalateAfterHours: 336, notifyOwnerOnEscalation: false },
      { urgency: "medium", respondWithinHours: 48, escalateAfterHours: 96, notifyOwnerOnEscalation: true },
      { urgency: "high", respondWithinHours: 24, escalateAfterHours: 48, notifyOwnerOnEscalation: true },
      { urgency: "critical", respondWithinHours: 4, escalateAfterHours: 8, notifyOwnerOnEscalation: true },
    ],
  });

  approvalRegistry.register({
    key: "tool_request_approval",
    label: "Tool Execution Approval",
    description: "Approval workflow for high-risk tool execution requests before the tool is invoked.",
    entityType: "tool_request",
    requiresExecutiveBrief: false,
    allowBatchApproval: false,
    defaultUrgency: "high",
    autoRejectAfterDays: 3,
    slaConfigs: [
      { urgency: "low", respondWithinHours: 24, escalateAfterHours: 48, notifyOwnerOnEscalation: false },
      { urgency: "medium", respondWithinHours: 8, escalateAfterHours: 16, notifyOwnerOnEscalation: true },
      { urgency: "high", respondWithinHours: 2, escalateAfterHours: 4, notifyOwnerOnEscalation: true },
      { urgency: "critical", respondWithinHours: 1, escalateAfterHours: 2, notifyOwnerOnEscalation: true },
    ],
  });
}
