import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface AiEmployeeMemoryConfig {
  shortTermTtlMinutes: number;
  longTermEnabled: boolean;
  contextKeys: string[];
}

export interface AiEmployeeEntry extends RegistryEntry {
  mission: string;
  responsibilities: string[];
  capabilities: string[];
  requiredTools: string[];
  kpis: string[];
  permissions: string[];
  escalationRules: string[];
  lifecycle: "draft" | "available" | "deprecated";
  // Wave 1C: Full AI Employee Contract
  readModels: string[];
  writeModels: string[];
  allowedActions: string[];
  decisionAuthority: "none" | "suggest" | "recommend" | "approve" | "execute";
  promptTemplateKey: string;
  memory: AiEmployeeMemoryConfig;
  businessObjectives: string[];
  lifecycleStages: string[];
}

export interface AiEmployeeEscalationRule {
  condition: string;
  escalateTo: string;
  method: string;
}

export type AiEmployeeRegistration = Omit<
  AiEmployeeEntry,
  "escalationRules"
> & {
  escalationRules: Array<string | AiEmployeeEscalationRule>;
};

const registry = createRegistry<AiEmployeeEntry>();

export const aiEmployeeRegistry = {
  list: registry.list,
  get: registry.get,
  register(entry: AiEmployeeRegistration): void {
    registry.register({
      ...entry,
      escalationRules: entry.escalationRules.map((rule) =>
        typeof rule === "string"
          ? rule
          : `${rule.condition} -> ${rule.escalateTo} via ${rule.method}`,
      ),
    });
  },
};
