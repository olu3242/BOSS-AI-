import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface RuntimeEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly kind:
    | "identity"
    | "agent"
    | "workflow"
    | "automation"
    | "event"
    | "queue"
    | "scheduler"
    | "observability"
    | "discovery"
    | "graph"
    | "semantic"
    | "query"
    | "capability";
  readonly implementationPackage: string;
  readonly owner: string;
  readonly version: string;
  readonly status: "planned" | "internal_alpha" | "available" | "deprecated";
  readonly documentation: string;
}

export const runtimeRegistry = createReadonlyRegistry<RuntimeEntry>();
