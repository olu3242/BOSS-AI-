import { eventRegistry } from "../registries/event.js";

/**
 * Canonical platform event contracts ({context}.{entity}.{verb}).
 * Platform-wide, not pack-specific — seeded once here rather than by
 * any individual capability pack.
 */
const events = [
  { key: "organization.created", label: "Organization Created", description: "A new organization was created." },
  { key: "business.created", label: "Business Created", description: "A new business was created." },
  { key: "business.updated", label: "Business Updated", description: "A business record was updated." },
  { key: "business.health.updated", label: "Business Health Updated", description: "The business health score changed." },
  { key: "business.timeline.updated", label: "Business Timeline Updated", description: "A new timeline entry was appended." },
  { key: "audit.started", label: "Audit Started", description: "A business audit/MRI was started." },
  { key: "audit.completed", label: "Audit Completed", description: "A business audit/MRI was completed." },
  { key: "constraint.detected", label: "Constraint Detected", description: "A constraint was detected for a business." },
  { key: "constraint.resolved", label: "Constraint Resolved", description: "A constraint was resolved." },
  { key: "recommendation.generated", label: "Recommendation Generated", description: "A new recommendation was generated." },
  { key: "workflow.installed", label: "Workflow Installed", description: "A workflow definition was installed for a business." },
  { key: "workflow.started", label: "Workflow Started", description: "A workflow instance started executing." },
  { key: "workflow.completed", label: "Workflow Completed", description: "A workflow instance completed successfully." },
  { key: "workflow.failed", label: "Workflow Failed", description: "A workflow instance failed." },
  { key: "agent.created", label: "Agent Created", description: "An AI employee instance was created." },
  { key: "agent.started", label: "Agent Started", description: "An AI employee instance started a task." },
  { key: "agent.completed", label: "Agent Completed", description: "An AI employee instance completed a task." },
  { key: "notification.sent", label: "Notification Sent", description: "A notification was sent to a user or customer." },
  { key: "kpi.updated", label: "KPI Updated", description: "A KPI value was recalculated." },
  { key: "dashboard.updated", label: "Dashboard Updated", description: "Dashboard data was refreshed." },
] as const;

export function seedEventRegistry(): void {
  for (const event of events) {
    eventRegistry.register(event);
  }
}
