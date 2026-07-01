import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface TriggerEntry extends RegistryEntry {
  readonly id: "manual" | "event" | "schedule";
  readonly displayName: string;
  readonly key: "manual" | "event" | "schedule";
  readonly label: string;
  readonly description: string;
  readonly workflowIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: "active" | "deprecated";
  readonly documentation: string;
}

export const triggerRegistry = createReadonlyRegistry<TriggerEntry>();
