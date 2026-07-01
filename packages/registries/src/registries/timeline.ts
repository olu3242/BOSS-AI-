import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type TimelineFilterPreset =
  | "all"
  | "decisions_only"
  | "health_changes"
  | "approvals"
  | "automations"
  | "last_7_days"
  | "last_30_days";

export type TimelineSortOrder = "newest_first" | "oldest_first";

export interface TimelineFilterConfig {
  preset: TimelineFilterPreset;
  label: string;
  description: string;
  defaultSort: TimelineSortOrder;
  maxEntries: number;
}

export interface TimelineEntry extends RegistryEntry {
  description: string;
  defaultFilter: TimelineFilterPreset;
  filters: TimelineFilterConfig[];
  showEventTypes: string[];
  groupByDay: boolean;
  enableSearch: boolean;
}

export const timelineRegistry = createRegistry<TimelineEntry>();
