import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface AiEmployeeMemoryConfig {
  shortTermTtlMinutes: number;
  longTermEnabled: boolean;
  contextKeys: string[];
}

export interface AiEmployeeEntry extends RegistryEntry {
  description?: string;
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
  "escalationRules" | "readModels" | "writeModels" | "allowedActions" | "decisionAuthority" | "promptTemplateKey" | "memory" | "businessObjectives" | "lifecycleStages"
> & {
  escalationRules: Array<string | AiEmployeeEscalationRule>;
  // Wave 1C fields are optional for backward-compatible registrations
  readModels?: string[];
  writeModels?: string[];
  allowedActions?: string[];
  decisionAuthority?: AiEmployeeEntry["decisionAuthority"];
  promptTemplateKey?: string;
  memory?: AiEmployeeMemoryConfig;
  businessObjectives?: string[];
  lifecycleStages?: string[];
};

const registry = createRegistry<AiEmployeeEntry>();

const DEFAULT_MEMORY: AiEmployeeMemoryConfig = { shortTermTtlMinutes: 60, longTermEnabled: false, contextKeys: [] };

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
      readModels: entry.readModels ?? [],
      writeModels: entry.writeModels ?? [],
      allowedActions: entry.allowedActions ?? [],
      decisionAuthority: entry.decisionAuthority ?? "recommend",
      promptTemplateKey: entry.promptTemplateKey ?? `${entry.key}.default`,
      memory: entry.memory ?? DEFAULT_MEMORY,
      businessObjectives: entry.businessObjectives ?? [],
      lifecycleStages: entry.lifecycleStages ?? [],
    });
  },
};
