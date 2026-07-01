import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface GovernanceEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly scopeRegistryIds: readonly string[];
  readonly policyIds: readonly string[];
  readonly owner: string;
  readonly approval: "not_required" | "human_required";
  readonly riskLevel: "low" | "medium" | "high";
  readonly changeControl: "pull_request";
  readonly lifecycleId: string;
  readonly documentation: string;
  readonly version: string;
  readonly status: "active" | "deprecated";
}

export const governanceRegistry =
  createReadonlyRegistry<GovernanceEntry>();
