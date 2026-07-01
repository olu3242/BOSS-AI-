import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export type EventCategory =
  | "organization"
  | "business"
  | "audit"
  | "constraint"
  | "recommendation"
  | "workflow"
  | "agent"
  | "notification"
  | "kpi"
  | "dashboard"
  | "capability";

/**
 * Canonical platform event contracts: {context}.{entity}.{verb}.
 * Loop emits these; MCP and Analytics consume them. No payload schema
 * yet — that lands with the bounded context that owns each event.
 */
export interface EventEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly publisherIds: readonly string[];
  readonly subscriberIds: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: "active" | "deprecated";
  readonly riskLevel: "low" | "medium" | "high";
  readonly documentation: string;
  readonly tags: readonly string[];
}

export const eventRegistry = createReadonlyRegistry<EventEntry>();
