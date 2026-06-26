import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export interface PromptEntry extends RegistryEntry {
  role: "system" | "agent" | "analysis" | "industry";
  template: string;
}

export const promptRegistry = createRegistry<PromptEntry>();
