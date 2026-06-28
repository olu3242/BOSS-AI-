import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface DashboardEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly featureIds: readonly string[];
  readonly dataSourceIds: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: "internal_alpha" | "available" | "deprecated";
  readonly documentation: string;
}

export const dashboardRegistry = createReadonlyRegistry<DashboardEntry>();
