import type { RegistryEntry } from "../types.js";

export type CapabilityCategory =
  | "executive"
  | "sales"
  | "marketing"
  | "finance"
  | "operations"
  | "customer_success"
  | "support"
  | "automation"
  | "scheduling"
  | "crm"
  | "email"
  | "communications"
  | "knowledge"
  | "reporting"
  | "analytics"
  | "compliance"
  | "ai"
  | "documents"
  | "integrations"
  | "notifications"
  | "system";

export type CapabilityExecutionMode = "manual" | "event" | "schedule";
export type CapabilityRiskLevel = "low" | "medium" | "high";
export type CapabilityComplexity = "low" | "medium" | "high";
export type CapabilityStatus = "active" | "deprecated" | "disabled";

export interface CapabilityEntry extends RegistryEntry {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly category: CapabilityCategory;
  readonly subcategory: string;
  readonly businessDomain: string;
  readonly supportedIndustries: readonly string[];
  readonly requiredInputs: readonly string[];
  readonly generatedOutputs: readonly string[];
  readonly dependencies: readonly string[];
  readonly requiredPermissions: readonly string[];
  readonly executionMode: readonly CapabilityExecutionMode[];
  readonly riskLevel: CapabilityRiskLevel;
  readonly complexity: CapabilityComplexity;
  readonly owner: string;
  readonly version: string;
  readonly status: CapabilityStatus;
  readonly tags: readonly string[];
}

export interface CapabilityRegistry {
  list(): readonly CapabilityEntry[];
  get(key: string): CapabilityEntry | undefined;
  register(entry: CapabilityEntry): void;
}

const entries = new Map<string, CapabilityEntry>();

export const capabilityRegistry: CapabilityRegistry = {
  list: () => Object.freeze(Array.from(entries.values())),
  get: (key) => entries.get(key),
  register: (entry) => {
    if (entries.has(entry.key)) {
      throw new Error(`Capability registry entry already exists for key "${entry.key}"`);
    }
    entries.set(entry.key, Object.freeze(entry));
  },
};
