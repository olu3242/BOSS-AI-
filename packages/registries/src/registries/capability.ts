import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface CapabilityEntry extends RegistryEntry {
  description: string;
}

export const capabilityRegistry = createRegistry<CapabilityEntry>();
