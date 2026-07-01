import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type ToolAuditLevel = "none" | "standard" | "sensitive";

/**
 * A concrete, registry-driven Tool that fulfills one Capability Contract
 * through one of several supported Providers. The Tool Fabric resolves
 * which provider to use at execution time based on the business's
 * connected integrations and policies — never hardcoded.
 */
export interface ToolDefinitionEntry extends RegistryEntry {
  toolKey: string;
  label: string;
  capabilityKey: string;
  supportedProviderKeys: string[];
  requiredPermissions: string[];
  retryLimit: number;
  timeoutMs: number;
  rateLimitPerMinute: number;
  auditLevel: ToolAuditLevel;
}

export const toolDefinitionRegistry = createRegistry<ToolDefinitionEntry>();
