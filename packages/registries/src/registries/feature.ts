import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface FeatureEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly sourcePaths: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: "available" | "internal_alpha" | "planned" | "deprecated";
}

export const featureRegistry = createReadonlyRegistry<FeatureEntry>();
