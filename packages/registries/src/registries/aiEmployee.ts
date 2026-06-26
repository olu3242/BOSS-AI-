import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface AiEmployeeEntry extends RegistryEntry {
  mission: string;
  responsibilities: string[];
  capabilities: string[];
  requiredTools: string[];
  kpis: string[];
  permissions: string[];
  escalationRules: string[];
  lifecycle: "draft" | "available" | "deprecated";
}

export const aiEmployeeRegistry = createRegistry<AiEmployeeEntry>();
