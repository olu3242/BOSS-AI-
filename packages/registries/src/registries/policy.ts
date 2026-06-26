import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type PolicyCategory = "approval" | "security" | "privacy" | "execution" | "escalation";

export interface PolicyEntry extends RegistryEntry {
  category: PolicyCategory;
  description: string;
}

export const policyRegistry = createRegistry<PolicyEntry>();
