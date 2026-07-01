import { timelineRegistry } from "@boss/registries";

export function seedTimelines(): void {
  timelineRegistry.register({
    key: "smb_timeline_default",
    label: "SMB Business Timeline",
    description: "Default timeline configuration for small and medium businesses.",
    defaultFilter: "all",
    filters: [
      {
        preset: "all",
        label: "All Events",
        description: "Show every business event in chronological order.",
        defaultSort: "newest_first",
        maxEntries: 100,
      },
      {
        preset: "decisions_only",
        label: "Decisions",
        description: "Show only decision generation and approval events.",
        defaultSort: "newest_first",
        maxEntries: 50,
      },
      {
        preset: "health_changes",
        label: "Health Changes",
        description: "Show health score calculations and dimension changes.",
        defaultSort: "newest_first",
        maxEntries: 50,
      },
      {
        preset: "approvals",
        label: "Approvals",
        description: "Show all approval and rejection events.",
        defaultSort: "newest_first",
        maxEntries: 50,
      },
      {
        preset: "automations",
        label: "Automations",
        description: "Show tool executions and workflow completions.",
        defaultSort: "newest_first",
        maxEntries: 50,
      },
      {
        preset: "last_7_days",
        label: "Last 7 Days",
        description: "All events from the past week.",
        defaultSort: "newest_first",
        maxEntries: 200,
      },
      {
        preset: "last_30_days",
        label: "Last 30 Days",
        description: "All events from the past month.",
        defaultSort: "newest_first",
        maxEntries: 500,
      },
    ],
    showEventTypes: [
      "business.created",
      "business.mri.completed",
      "business.dna.derived",
      "business.health.calculated",
      "business.constraint.detected",
      "business.recommendation.generated",
      "business.decision.generated",
      "business.plan.created",
      "business.loop.completed",
      "business.outcome.verified",
      "business.learning.recorded",
      "business.kpi.measured",
      "business.rootcause.detected",
      "workflow.instance.completed",
    ],
    groupByDay: true,
    enableSearch: true,
  });
}
