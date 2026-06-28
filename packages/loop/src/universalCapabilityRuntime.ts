import { randomUUID } from "node:crypto";
import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import {
  capabilityPackRegistry,
  capabilityRegistry,
  type CapabilityEntry,
  type CapabilityPackEntry,
  type CapabilityRegistry,
  type ReadonlyRegistry,
} from "@boss/registries";
import type {
  CapabilityExecution,
  CapabilityExecutionContext,
  CapabilityExecutionEventPayload,
  CapabilityExecutionRequest,
  CapabilityExecutionResult,
  CapabilityExecutionState,
  CapabilityManifest,
} from "@boss/types";
import type { RuntimeTelemetry } from "./telemetry.js";
import { InMemoryRuntimeTelemetry } from "./telemetry.js";
import {
  CapabilityNotFoundError,
  DependencyResolutionFailedError,
  InvalidExecutionStateError,
  ManifestInvalidError,
  PermissionDeniedError,
  RuntimeFailureError,
} from "./ucrErrors.js";

export const UNIVERSAL_CAPABILITY_RUNTIME_VERSION = "0.1.0";

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child);
    }
  }
  return value;
}

function eventContext(context: CapabilityExecutionContext): EventContext {
  return {
    orgId: context.tenantId,
    businessId: context.organizationId,
    actorId: context.userId,
    requestId: context.requestId,
    correlationId: context.correlationId,
    traceId: context.traceId,
  };
}

const allowedTransitions: Readonly<
  Record<CapabilityExecutionState, readonly CapabilityExecutionState[]>
> = freeze({
  pending: ["initializing", "cancelled"],
  initializing: ["validating", "failed", "cancelled"],
  validating: ["ready", "failed", "cancelled"],
  ready: ["running", "failed", "cancelled"],
  running: ["waiting", "retrying", "completed", "failed", "cancelled"],
  waiting: ["running", "failed", "cancelled"],
  retrying: ["running", "failed", "cancelled"],
  completed: ["replaying"],
  failed: ["replaying"],
  cancelled: ["replaying"],
  replaying: ["initializing", "failed", "cancelled"],
});

export class CapabilityExecutionStateMachine {
  canTransition(
    from: CapabilityExecutionState,
    to: CapabilityExecutionState,
  ): boolean {
    return allowedTransitions[from].includes(to);
  }

  assertTransition(
    from: CapabilityExecutionState,
    to: CapabilityExecutionState,
  ): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidExecutionStateError(
        `Capability execution cannot transition from ${from} to ${to}.`,
        { from, to },
      );
    }
  }
}

export interface CapabilityExecutor {
  execute(
    execution: CapabilityExecution,
  ): Promise<CapabilityExecutionResult>;
}

export interface CapabilityLoader {
  load(capabilityId: string): Promise<CapabilityEntry>;
}

export interface ContextResolver {
  resolve(
    request: CapabilityExecutionRequest,
    manifest: CapabilityManifest,
  ): Promise<CapabilityExecutionContext>;
}

export interface ManifestResolver {
  resolve(
    capabilityId: string,
    capabilityVersion: string,
  ): Promise<CapabilityManifest>;
}

export interface DependencyResolver {
  resolve(capability: CapabilityEntry): Promise<readonly CapabilityEntry[]>;
}

export interface EvidenceWriter {
  write(
    execution: CapabilityExecution,
    evidence: Readonly<Record<string, unknown>>,
  ): Promise<string>;
}

export class UnsupportedCapabilityExecutor implements CapabilityExecutor {
  async execute(
    _execution: CapabilityExecution,
  ): Promise<CapabilityExecutionResult> {
    throw new RuntimeFailureError(
      "Capability execution is unavailable in UCR Batch 1.",
    );
  }
}

export class RegistryCapabilityLoader implements CapabilityLoader {
  constructor(
    private readonly registry: CapabilityRegistry = capabilityRegistry,
  ) {}

  async load(capabilityId: string): Promise<CapabilityEntry> {
    const capability = this.registry.get(capabilityId);
    if (!capability) {
      throw new CapabilityNotFoundError(
        `Capability "${capabilityId}" is not registered.`,
        { capabilityId },
      );
    }
    return capability;
  }
}

export class RegistryManifestResolver implements ManifestResolver {
  constructor(
    private readonly registry: ReadonlyRegistry<CapabilityPackEntry> =
      capabilityPackRegistry,
  ) {}

  async resolve(
    capabilityId: string,
    capabilityVersion: string,
  ): Promise<CapabilityManifest> {
    const entry = this.registry.get(
      `${capabilityId}@${capabilityVersion}`,
    );
    if (!entry) {
      throw new ManifestInvalidError(
        `Manifest "${capabilityId}@${capabilityVersion}" is not published.`,
        { capabilityId, capabilityVersion },
      );
    }
    return entry.manifest;
  }
}

export class RegistryDependencyResolver implements DependencyResolver {
  constructor(
    private readonly registry: CapabilityRegistry = capabilityRegistry,
  ) {}

  async resolve(
    capability: CapabilityEntry,
  ): Promise<readonly CapabilityEntry[]> {
    const resolved: CapabilityEntry[] = [];
    const missing: string[] = [];
    for (const dependencyId of capability.dependencies) {
      const dependency = this.registry.get(dependencyId);
      if (dependency) resolved.push(dependency);
      else missing.push(dependencyId);
    }
    if (missing.length > 0) {
      throw new DependencyResolutionFailedError(
        `Capability dependencies are not registered: ${missing.join(", ")}.`,
        { capabilityId: capability.id, missing },
      );
    }
    return freeze(resolved);
  }
}

export class DefaultContextResolver implements ContextResolver {
  async resolve(
    request: CapabilityExecutionRequest,
    manifest: CapabilityManifest,
  ): Promise<CapabilityExecutionContext> {
    if (
      request.capabilityId !== manifest.id ||
      request.capabilityVersion !== manifest.version
    ) {
      throw new ManifestInvalidError(
        "Execution request does not match the resolved manifest.",
        {
          capabilityId: request.capabilityId,
          capabilityVersion: request.capabilityVersion,
          manifestId: manifest.id,
          manifestVersion: manifest.version,
        },
      );
    }
    const missing = manifest.requiredPermissions.filter(
      (permission) => !request.permissions.includes(permission),
    );
    if (missing.length > 0) {
      throw new PermissionDeniedError(
        `Execution requires permissions: ${missing.join(", ")}.`,
        { missing },
      );
    }
    return freeze({
      ...request,
      featureFlags: { ...request.featureFlags },
      permissions: [...request.permissions],
      manifest: structuredClone(manifest),
    });
  }
}

export class InMemoryEvidenceWriter implements EvidenceWriter {
  private readonly records = new Map<
    string,
    Readonly<Record<string, unknown>>
  >();

  async write(
    execution: CapabilityExecution,
    evidence: Readonly<Record<string, unknown>>,
  ): Promise<string> {
    const id = randomUUID();
    this.records.set(
      id,
      freeze({
        executionId: execution.id,
        evidence: structuredClone(evidence),
      }),
    );
    return id;
  }

  list(): readonly Readonly<Record<string, unknown>>[] {
    return freeze([...this.records.values()]);
  }
}

export interface UniversalCapabilityRuntimeOptions {
  readonly runtimeVersion?: string;
  readonly eventBus?: EventBus;
  readonly telemetry?: RuntimeTelemetry;
  readonly stateMachine?: CapabilityExecutionStateMachine;
}

export class UniversalCapabilityRuntime {
  readonly runtimeVersion: string;
  private readonly events: EventBus;
  private readonly telemetry: RuntimeTelemetry;
  private readonly stateMachine: CapabilityExecutionStateMachine;

  constructor(options: UniversalCapabilityRuntimeOptions = {}) {
    this.runtimeVersion =
      options.runtimeVersion ?? UNIVERSAL_CAPABILITY_RUNTIME_VERSION;
    this.events = options.eventBus ?? new InMemoryEventBus();
    this.telemetry = options.telemetry ?? new InMemoryRuntimeTelemetry();
    this.stateMachine =
      options.stateMachine ?? new CapabilityExecutionStateMachine();
  }

  async createExecution(
    context: CapabilityExecutionContext,
    executionId: string = randomUUID(),
  ): Promise<CapabilityExecution> {
    const now = new Date().toISOString();
    const execution = freeze({
      id: executionId,
      context,
      state: "pending" as const,
      session: {
        id: randomUUID(),
        executionId,
        state: "pending" as const,
        openedAt: now,
        closedAt: null,
      },
      metadata: {
        runtimeVersion: this.runtimeVersion,
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        completedAt: null,
        durationMs: null,
        retryCount: 0,
        failureReason: null,
        transitions: [],
      },
    });
    await this.emit("capability.execution.created", execution);
    this.telemetry.metric(
      "ucr.execution.created",
      1,
      "count",
      eventContext(context),
      { capabilityId: context.capabilityId, state: "pending" },
    );
    return execution;
  }

  async transition(
    execution: CapabilityExecution,
    target: CapabilityExecutionState,
    reason: string | null = null,
  ): Promise<CapabilityExecution> {
    this.stateMachine.assertTransition(execution.state, target);
    const now = new Date().toISOString();
    const terminal = ["completed", "failed", "cancelled"].includes(target);
    const startedAt =
      target === "running" && !execution.metadata.startedAt
        ? now
        : execution.metadata.startedAt;
    const durationMs =
      terminal && startedAt
        ? Math.max(0, Date.parse(now) - Date.parse(startedAt))
        : execution.metadata.durationMs;
    const updated = freeze({
      ...execution,
      state: target,
      session: {
        ...execution.session,
        state: target,
        closedAt: terminal ? now : execution.session.closedAt,
      },
      metadata: {
        ...execution.metadata,
        updatedAt: now,
        startedAt,
        completedAt: terminal ? now : execution.metadata.completedAt,
        durationMs,
        retryCount:
          execution.metadata.retryCount + (target === "retrying" ? 1 : 0),
        failureReason:
          target === "failed"
            ? reason ?? "Runtime failure."
            : execution.metadata.failureReason,
        transitions: [
          ...execution.metadata.transitions,
          {
            from: execution.state,
            to: target,
            reason,
            occurredAt: now,
          },
        ],
      },
    });
    this.observeTransition(updated, execution.state);
    const eventType = this.eventFor(target);
    if (eventType) await this.emit(eventType, updated);
    return updated;
  }

  private eventFor(state: CapabilityExecutionState): string | null {
    if (state === "running") return "capability.execution.started";
    if (state === "completed") return "capability.execution.completed";
    if (state === "failed") return "capability.execution.failed";
    return null;
  }

  private observeTransition(
    execution: CapabilityExecution,
    from: CapabilityExecutionState,
  ): void {
    const context = eventContext(execution.context);
    this.telemetry.log(
      execution.state === "failed" ? "error" : "info",
      "UCR execution state transitioned.",
      context,
      {
        executionId: execution.id,
        capabilityId: execution.context.capabilityId,
        from,
        to: execution.state,
        failureReason: execution.metadata.failureReason,
      },
    );
    this.telemetry.metric(
      "ucr.execution.transition",
      1,
      "count",
      context,
      { from, to: execution.state },
    );
    if (execution.metadata.durationMs !== null) {
      this.telemetry.metric(
        "ucr.execution.duration",
        execution.metadata.durationMs,
        "milliseconds",
        context,
        {
          capabilityId: execution.context.capabilityId,
          state: execution.state,
        },
      );
    }
  }

  private emit(
    type: string,
    execution: CapabilityExecution,
  ): Promise<void> {
    const payload: CapabilityExecutionEventPayload = freeze({
      executionId: execution.id,
      capabilityId: execution.context.capabilityId,
      tenantId: execution.context.tenantId,
      correlationId: execution.context.correlationId,
      traceId: execution.context.traceId,
      timestamp: new Date().toISOString(),
      runtimeVersion: this.runtimeVersion,
    });
    return this.events.publish(
      createBossEvent(
        type,
        payload,
        eventContext(execution.context),
      ),
    );
  }
}
