import { eventRegistry } from "../registries/event.js";
import type { EventCategory, EventEntry } from "../registries/event.js";

/**
 * Canonical platform event contracts ({context}.{entity}.{verb}).
 * Platform-wide, not pack-specific — seeded once here rather than by
 * any individual capability pack.
 */
const eventSources = [
  { key: "organization.created", label: "Organization Created", description: "A new organization was created." },
  { key: "organization.switched", label: "Organization Switched", description: "A user changed the active organization." },
  { key: "business.discovery.created", label: "Business Discovery Created", description: "A canonical Business Discovery aggregate was created." },
  { key: "business.discovery.updated", label: "Business Discovery Updated", description: "A new canonical Business Context version was persisted." },
  { key: "business.discovery.validated", label: "Business Discovery Validated", description: "Business Discovery passed foundational validation." },
  { key: "business.context.published", label: "Business Context Published", description: "A canonical Business Context became available to execution runtimes." },
  { key: "business.graph.created", label: "Business Graph Created", description: "A tenant Business Knowledge Graph was created from canonical Business Context." },
  { key: "business.node.created", label: "Business Graph Node Created", description: "A node was added to a tenant Business Knowledge Graph." },
  { key: "business.node.updated", label: "Business Graph Node Updated", description: "A node in a tenant Business Knowledge Graph was updated." },
  { key: "business.relationship.created", label: "Business Graph Relationship Created", description: "A relationship was added to a tenant Business Knowledge Graph." },
  { key: "business.relationship.removed", label: "Business Graph Relationship Removed", description: "A relationship was removed from a tenant Business Knowledge Graph." },
  { key: "business.graph.versioned", label: "Business Graph Versioned", description: "An immutable tenant Business Knowledge Graph snapshot was persisted." },
  { key: "business.graph.loaded", label: "Business Graph Loaded", description: "The Graph Runtime opened a version-pinned graph session." },
  { key: "business.graph.traversed", label: "Business Graph Traversed", description: "The Graph Runtime completed a deterministic graph traversal." },
  { key: "business.graph.validated", label: "Business Graph Validated", description: "The Graph Runtime produced a structural validation report." },
  { key: "business.graph.cache.refreshed", label: "Business Graph Cache Refreshed", description: "A tenant and version-aware graph cache entry was refreshed." },
  { key: "business.semantic.loaded", label: "Business Semantic Context Loaded", description: "A versioned Business Semantic Context was loaded through the Semantic Layer." },
  { key: "business.context.resolved", label: "Business Context Resolved", description: "A business-oriented context was resolved through the Semantic Layer." },
  { key: "business.semantic.view.created", label: "Business Semantic View Created", description: "A registered, version-aware semantic view was projected." },
  { key: "business.semantic.updated", label: "Business Semantic Context Updated", description: "Graph versioning invalidated the derived semantic context." },
  { key: "business.query.executed", label: "Business Query Executed", description: "A canonical, version-aware business query completed." },
  { key: "business.view.generated", label: "Business View Generated", description: "BQIL generated a reusable business view." },
  { key: "business.projection.generated", label: "Business Projection Generated", description: "BQIL generated a deterministic business projection." },
  { key: "business.insight.generated", label: "Business Insight Generated", description: "BQIL generated factual, evidence-referenced insights." },
  { key: "capability.pack.installed", label: "Capability Pack Installed", description: "A signed capability pack version was installed for a tenant." },
  { key: "capability.pack.activated", label: "Capability Pack Activated", description: "An installed capability pack was activated for a tenant." },
  { key: "capability.pack.updated", label: "Capability Pack Updated", description: "A tenant capability pack installation changed version." },
  { key: "capability.pack.deactivated", label: "Capability Pack Deactivated", description: "An active capability pack was gracefully deactivated." },
  { key: "capability.pack.removed", label: "Capability Pack Removed", description: "A capability pack installation was removed from a tenant." },
  { key: "capability.pack.validation.failed", label: "Capability Pack Validation Failed", description: "A capability pack failed manifest, dependency, compatibility, or security validation." },
  { key: "business.created", label: "Business Created", description: "A new business was created." },
  { key: "business.updated", label: "Business Updated", description: "A business record was updated." },
  { key: "business.health.updated", label: "Business Health Updated", description: "The business health score changed." },
  { key: "business.timeline.updated", label: "Business Timeline Updated", description: "A new timeline entry was appended." },
  { key: "business.diagnostic.started", label: "Diagnostic Started", description: "A business diagnostic started." },
  { key: "business.diagnostic.analysis.completed", label: "Diagnostic Analysis Completed", description: "Diagnostic area analysis completed." },
  { key: "business.diagnostic.root_cause.identified", label: "Diagnostic Root Cause Identified", description: "A diagnostic root cause was identified." },
  { key: "business.diagnostic.completed", label: "Diagnostic Completed", description: "A persisted business diagnostic completed." },
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

const owners: Record<EventCategory, string> = {
  organization: "Platform",
  business: "Operations",
  audit: "Compliance",
  constraint: "Operations",
  recommendation: "Executive",
  workflow: "Automation",
  agent: "Automation",
  notification: "Operations",
  kpi: "Analytics",
  dashboard: "Analytics",
  capability: "Platform",
};

export const events: readonly EventEntry[] = Object.freeze(
  eventSources.map((event): EventEntry => {
    const category = event.key.split(".")[0] as EventCategory;
    return {
      id: event.key,
      displayName: event.label,
      key: event.key,
      label: event.label,
      description: event.description,
      category,
      publisherIds: [],
      subscriberIds: [],
      owner: owners[category],
      version: "1.0.0",
      status: "active",
      riskLevel:
        category === "audit" || category === "organization" ? "high" : "medium",
      documentation: "packages/registries/src/seed/events.ts",
      tags: event.key.split("."),
    };
  }),
);

export function seedEventRegistry(): void {
  for (const event of events) {
    eventRegistry.register(event);
  }
}
