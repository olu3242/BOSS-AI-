import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface AutomationEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly workflowIds: readonly string[];
  readonly triggerIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly notificationChannelIds: readonly string[];
  readonly integrationIds: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: "draft" | "active" | "deprecated" | "disabled";
  readonly documentation: string;
}

export const automationRegistry = createReadonlyRegistry<AutomationEntry>();
