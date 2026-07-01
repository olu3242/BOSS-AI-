import { workflowRegistry } from "@boss/registries";
import type {
  ExecutionMode,
  WorkflowDefinitionEntry,
} from "@boss/registries";
import { agents } from "./agents.js";

interface WorkflowSource {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly triggerType: ExecutionMode;
  readonly relatedConstraints: readonly string[];
  readonly relatedKpis: readonly string[];
  readonly owner: string;
}

const workflowSources = [
  { key: "lead_follow_up_recovery", label: "Lead Follow-Up Recovery", description: "Re-engage leads that have gone cold.", triggerType: "event", relatedConstraints: ["missed_leads", "slow_follow_up"], relatedKpis: ["lead_response_time", "lead_conversion_rate"], owner: "Sales" },
  { key: "appointment_reminder", label: "Appointment Reminder", description: "Remind customers of upcoming appointments.", triggerType: "schedule", relatedConstraints: ["manual_scheduling"], relatedKpis: ["customer_retention"], owner: "Operations" },
  { key: "customer_re_engagement", label: "Customer Re-engagement", description: "Win back customers who haven't returned.", triggerType: "schedule", relatedConstraints: ["poor_customer_retention"], relatedKpis: ["customer_retention"], owner: "Customer Success" },
  { key: "invoice_follow_up", label: "Invoice Follow-Up", description: "Chase outstanding invoices automatically.", triggerType: "schedule", relatedConstraints: ["outstanding_invoices"], relatedKpis: ["outstanding_invoices"], owner: "Finance" },
  { key: "review_request", label: "Review Request", description: "Ask satisfied customers for a review.", triggerType: "event", relatedConstraints: ["low_reviews"], relatedKpis: ["review_rating"], owner: "Customer Success" },
  { key: "administrative_automation", label: "Administrative Automation", description: "Automate repetitive administrative tasks.", triggerType: "manual", relatedConstraints: ["administrative_overload", "owner_bottleneck"], relatedKpis: ["administrative_hours"], owner: "Operations" },
] as const satisfies readonly WorkflowSource[];

export const workflows: readonly WorkflowDefinitionEntry[] = Object.freeze(
  workflowSources.map((source): WorkflowDefinitionEntry => {
    const relatedAgents = agents.filter((agent) =>
      agent.workflows.some((workflow) => workflow.id === source.key),
    );
    return {
      id: source.key,
      displayName: source.label,
      key: source.key,
      label: source.label,
      description: source.description,
      triggerType: source.triggerType,
      relatedConstraints: source.relatedConstraints,
      relatedKpis: source.relatedKpis,
      agentIds: relatedAgents.map((agent) => agent.id),
      capabilityIds: Array.from(
        new Set(
          relatedAgents.flatMap((agent) =>
            agent.requiredCapabilities.map((capability) => capability.id),
          ),
        ),
      ),
      promptIds: relatedAgents.flatMap((agent) =>
        agent.prompts.map((prompt) => prompt.id),
      ),
      automationIds: [],
      triggerIds: [source.triggerType],
      eventIds: ["workflow.started", "workflow.completed", "workflow.failed"],
      notificationChannelIds: [],
      integrationIds: [],
      businessOutcomeIds: relatedAgents.map((agent) => agent.businessOutcomeId),
      owner: source.owner,
      version: "1.0.0",
      status: "draft",
      timeoutSeconds: null,
      retryPolicy: {
        maximumAttempts: 1,
        strategy: "none",
      },
      failureStrategy: "record_failure",
      documentation: "industry-packs/general-smb/src/data/workflows.ts",
      tags: [source.triggerType, source.owner.toLowerCase().replaceAll(" ", "_")],
    };
  }),
);

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
