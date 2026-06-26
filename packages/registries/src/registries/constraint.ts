import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface ConstraintEntry extends RegistryEntry {
  description: string;
  relatedCapabilities: string[];
}

export const constraintRegistry = createRegistry<ConstraintEntry>();
