import type { CapabilityManifest } from "./capabilityPack.js";
import type { ID } from "./primitives.js";

export type CapabilityExecutionId = ID;

export type CapabilityExecutionState =
  | "pending"
  | "initializing"
  | "validating"
  | "ready"
  | "running"
  | "waiting"
  | "retrying"
  | "completed"
  | "failed"
  | "cancelled"
  | "replaying";

export interface CapabilityExecutionRequest {
  readonly tenantId: ID;
  readonly organizationId: ID;
  readonly userId: ID;
  readonly capabilityId: ID;
  readonly capabilityVersion: string;
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly permissions: readonly string[];
  readonly requestId: string;
  readonly correlationId: string;
  readonly traceId: string;
}

export interface CapabilityExecutionContext
  extends CapabilityExecutionRequest {
  readonly manifest: CapabilityManifest;
}

export interface CapabilityExecutionTransition {
  readonly from: CapabilityExecutionState;
  readonly to: CapabilityExecutionState;
  readonly reason: string | null;
  readonly occurredAt: string;
}

export interface CapabilityExecutionMetadata {
  readonly runtimeVersion: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly durationMs: number | null;
  readonly retryCount: number;
  readonly failureReason: string | null;
  readonly transitions: readonly CapabilityExecutionTransition[];
}

export interface CapabilityExecutionSession {
  readonly id: ID;
  readonly executionId: CapabilityExecutionId;
  readonly state: CapabilityExecutionState;
  readonly openedAt: string;
  readonly closedAt: string | null;
}

export interface CapabilityExecution {
  readonly id: CapabilityExecutionId;
  readonly context: CapabilityExecutionContext;
  readonly state: CapabilityExecutionState;
  readonly session: CapabilityExecutionSession;
  readonly metadata: CapabilityExecutionMetadata;
}

export interface CapabilityExecutionResult<TResult = unknown> {
  readonly executionId: CapabilityExecutionId;
  readonly state: "completed" | "failed" | "cancelled";
  readonly value: TResult | null;
  readonly evidenceIds: readonly ID[];
  readonly completedAt: string;
  readonly durationMs: number;
  readonly error: {
    readonly code: string;
    readonly message: string;
  } | null;
}

export interface CapabilityExecutionEventPayload {
  readonly executionId: CapabilityExecutionId;
  readonly capabilityId: ID;
  readonly tenantId: ID;
  readonly correlationId: string;
  readonly traceId: string;
  readonly timestamp: string;
  readonly runtimeVersion: string;
}
