import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type ProviderCategory =
  | "email"
  | "sms"
  | "calendar"
  | "crm"
  | "accounting"
  | "storage"
  | "messaging"
  | "payments";

/**
 * A registered external system BOSS can integrate with. Never referenced
 * directly by AI Employees or Loop Runtime — only resolved by the Tool
 * Fabric on behalf of a Tool Contract.
 */
export interface ProviderDefinitionEntry extends RegistryEntry {
  providerKey: string;
  label: string;
  category: ProviderCategory;
  /** Capability keys this provider can fulfill. */
  supportedCapabilities: string[];
  authType: "oauth2" | "api_key" | "basic" | "none";
}

export const providerDefinitionRegistry = createRegistry<ProviderDefinitionEntry>();
