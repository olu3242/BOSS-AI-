import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type VerificationMethod = "kpi_delta" | "roi_comparison" | "sla_check" | "workflow_completion" | "composite";

export interface VerificationEntry extends RegistryEntry {
  description: string;
  method: VerificationMethod;
  primaryKpiKey: string;
  successThresholdPct: number;
  measurementWindowDays: number;
  minConfidence: number;
}

export const verificationRegistry = createRegistry<VerificationEntry>();
