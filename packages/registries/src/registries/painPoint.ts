import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface PainPointEntry extends RegistryEntry {
  label: string;
  relatedHealthDimensions: string[];
}

export const painPointRegistry = createRegistry<PainPointEntry>();
