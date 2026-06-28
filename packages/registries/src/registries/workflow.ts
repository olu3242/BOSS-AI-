import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export type WorkflowStatus = "draft" | "active" | "deprecated" | "disabled";

export interface WorkflowRetryPolicy {
  readonly maximumAttempts: number;
  readonly strategy: "none" | "fixed" | "exponential";
}

/**
 * Definitions only — no execution. Loop Runtime consumes these
 * definitions at run time; this registry never schedules or runs them.
 */
export interface WorkflowDefinitionEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly triggerType: "manual" | "event" | "schedule";
  readonly relatedConstraints: readonly string[];
  readonly relatedKpis: readonly string[];
  readonly agentIds: readonly string[];
  readonly capabilityIds: readonly string[];
  readonly promptIds: readonly string[];
  readonly automationIds: readonly string[];
  readonly triggerIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly notificationChannelIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly businessOutcomeIds: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: WorkflowStatus;
  readonly timeoutSeconds: number | null;
  readonly retryPolicy: WorkflowRetryPolicy;
  readonly failureStrategy: "record_failure" | "manual_intervention";
  readonly documentation: string;
  readonly tags: readonly string[];
}

export const workflowRegistry =
  createReadonlyRegistry<WorkflowDefinitionEntry>();
