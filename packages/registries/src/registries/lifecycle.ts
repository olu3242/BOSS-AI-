import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface LifecycleEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly entityType: "agent" | "capability" | "workflow" | "registry" | "policy";
  readonly state: string;
  readonly terminal: boolean;
  readonly allowedNextStateIds: readonly string[];
  readonly owner: string;
  readonly documentation: string;
  readonly version: string;
}

export const lifecycleRegistry =
  createReadonlyRegistry<LifecycleEntry>();
