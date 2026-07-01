import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type LoopFrequency = "realtime" | "hourly" | "daily" | "weekly";
export type LoopPhase =
  | "observe"
  | "analyze"
  | "decide"
  | "plan"
  | "execute"
  | "verify"
  | "learn"
  | "improve";

export interface LoopPhaseConfig {
  phase: LoopPhase;
  enabled: boolean;
  timeoutSeconds: number;
  retryOnFailure: boolean;
}

export interface OperatingLoopEntry extends RegistryEntry {
  description: string;
  frequency: LoopFrequency;
  phases: LoopPhaseConfig[];
  autoApproveThreshold: number;
  maxConcurrentDecisions: number;
  notifyOnCompletion: boolean;
}

export const operatingLoopRegistry = createRegistry<OperatingLoopEntry>();
