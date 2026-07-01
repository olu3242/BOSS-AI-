import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

/**
 * The stable API between AI Employees / Loop Runtime and the Tool &
 * Integration Fabric. Callers request a capability by key; they never know
 * which provider ultimately fulfills it.
 */
export interface CapabilityContractEntry extends RegistryEntry {
  capabilityKey: string;
  label: string;
  description: string;
  /** JSON-schema-shaped description of the request payload, never executable code. */
  inputSchema: Record<string, "string" | "number" | "boolean" | "object" | "array">;
  outputSchema: Record<string, "string" | "number" | "boolean" | "object" | "array">;
}

export const capabilityContractRegistry = createRegistry<CapabilityContractEntry>();
