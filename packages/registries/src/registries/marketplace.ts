import type { CapabilityPackType } from "@boss/types";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface MarketplaceEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly type: CapabilityPackType;
  readonly description: string;
  readonly owner: string;
  readonly version: string;
  readonly status: "published" | "deprecated";
  readonly documentation: string;
}

export const marketplaceRegistry =
  createReadonlyRegistry<MarketplaceEntry>();
