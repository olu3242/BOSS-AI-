import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

/**
 * Canonical platform event contracts: {context}.{entity}.{verb}.
 * Loop emits these; MCP and Analytics consume them. No payload schema
 * yet — that lands with the bounded context that owns each event.
 */
export interface EventEntry extends RegistryEntry {
  description: string;
}

export const eventRegistry = createRegistry<EventEntry>();
