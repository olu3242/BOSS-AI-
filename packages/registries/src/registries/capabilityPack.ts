import type {
  CapabilityManifest,
  CapabilityPackType,
  CapabilitySignature,
} from "@boss/types";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface CapabilityPackEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly type: CapabilityPackType;
  readonly manifest: CapabilityManifest;
  readonly manifestDigest: string;
  readonly signature: CapabilitySignature;
  readonly owner: string;
  readonly version: string;
  readonly status: "published" | "deprecated";
  readonly documentation: string;
}

export const capabilityPackRegistry =
  createReadonlyRegistry<CapabilityPackEntry>();
