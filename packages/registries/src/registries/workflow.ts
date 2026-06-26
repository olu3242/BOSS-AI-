import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

/**
 * Definitions only — no execution. Loop Runtime consumes these
 * definitions at run time; this registry never schedules or runs them.
 */
export interface WorkflowDefinitionEntry extends RegistryEntry {
  description: string;
  triggerType: "manual" | "event" | "schedule";
  relatedConstraints: string[];
  relatedKpis: string[];
}

export const workflowRegistry = createRegistry<WorkflowDefinitionEntry>();
