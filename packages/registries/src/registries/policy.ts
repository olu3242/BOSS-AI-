import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export type PolicyCategory = "approval" | "security" | "privacy" | "execution" | "escalation";

export interface PolicyEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly category: PolicyCategory;
  readonly description: string;
  readonly owner: string;
  readonly approval: "not_required" | "human_required";
  readonly riskLevel: "low" | "medium" | "high";
  readonly changeControl: "pull_request";
  readonly lifecycle: "active" | "deprecated";
  readonly documentation: string;
  readonly version: string;
  readonly tags: readonly string[];
}

export const policyRegistry = createReadonlyRegistry<PolicyEntry>();
