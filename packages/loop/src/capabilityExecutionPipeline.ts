import { randomUUID } from "node:crypto";
import { satisfiesVersion } from "@boss/capabilities";
import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import {
  capabilityPackRegistry,
  capabilityRegistry,
  featureRegistry,
  runtimeRegistry,
  type CapabilityEntry,
  type CapabilityPackEntry,
  type CapabilityRegistry,
  type ReadonlyRegistry,
  type RuntimeEntry,
  type FeatureEntry,
} from "@boss/registries";
import type {
  CapabilityExecution,
  CapabilityExecutionContext,
  CapabilityExecutionRequest,
  CapabilityExecutionResult,
  CapabilityManifest,
} from "@boss/types";
import type { RuntimeTelemetry } from "./telemetry.js";
import { InMemoryRuntimeTelemetry } from "./telemetry.js";
import {
  type CapabilityExecutor,
  type CapabilityLoader,
  type ContextResolver,
  type EvidenceWriter,
  type ManifestResolver,
  DefaultContextResolver,
  InMemoryEvidenceWriter,
  RegistryCapabilityLoader,
  RegistryManifestResolver,
  UNIVERSAL_CAPABILITY_RUNTIME_VERSION,
  UniversalCapabilityRuntime,
} from "./universalCapabilityRuntime.js";
import {
  DependencyResolutionFailedError,
  ManifestInvalidError,
  RuntimeFailureError,
  UniversalCapabilityRuntimeError,
} from "./ucrErrors.js";

export type PipelineStageName =
  | "request"
  | "resolve_capability"
  | "load_manifest"
  | "resolve_dependencies"
  | "build_context"
  | "validate_runtime"
  | "create_session"
  | "execute_capability"
  | "collect_evidence"
  | "persist_result"
  | "publish_events"
  | "finalize_session";

export const CAPABILITY_EXECUTION_STAGE_ORDER: readonly PipelineStageName[] =
  Object.freeze([
    "request",
    "resolve_capability",
    "load_manifest",
    "resolve_dependencies",
    "build_context",
    "validate_runtime",
    "create_session",
    "execute_capability",
    "collect_evidence",
    "persist_result",
    "publish_events",
    "finalize_session",
  ]);

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freeze(child);
    }
  }
  return value;
}

function requestEventContext(request: CapabilityExecutionRequest): EventContext {
  return {
    orgId: request.tenantId,
    businessId: request.organizationId,
    actorId: request.userId,
    requestId: request.requestId,
    correlationId: request.correlationId,
    traceId: request.traceId,
  };
}

export interface PipelineStageResult {
  readonly stage: PipelineStageName;
  readonly initializedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly status: "completed";
}

export interface PipelineContext {
  readonly executionId: string;
  readonly request: CapabilityExecutionRequest;
  readonly capability: CapabilityEntry | null;
  readonly manifest: CapabilityManifest | null;
  readonly dependencies: readonly CapabilityEntry[];
  readonly resolvedContext: CapabilityExecutionContext | null;
  readonly execution: CapabilityExecution | null;
  readonly result: CapabilityExecutionResult | null;
  readonly evidenceIds: readonly string[];
}

export interface PipelineResult {
  readonly executionId: string;
  readonly status: "completed" | "failed" | "cancelled";
  readonly execution: CapabilityExecution | null;
  readonly result: CapabilityExecutionResult | null;
  readonly stages: readonly PipelineStageResult[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly eventCount: number;
  readonly failureStage: PipelineStageName | null;
  readonly error: {
    readonly code: string;
    readonly message: string;
  } | null;
}

export interface PipelineStage {
  readonly name: PipelineStageName;
  initialize(context: PipelineContext): Promise<PipelineContext>;
  validate(context: PipelineContext): Promise<void>;
  execute(context: PipelineContext): Promise<PipelineContext>;
  complete(context: PipelineContext): Promise<PipelineContext>;
  cleanup(context: PipelineContext): Promise<void>;
}

export interface PipelineStageLifecycle {
  readonly initialize?: (
    context: PipelineContext,
  ) => PipelineContext | Promise<PipelineContext>;
  readonly validate?: (
    context: PipelineContext,
  ) => void | Promise<void>;
  readonly execute?: (
    context: PipelineContext,
  ) => PipelineContext | Promise<PipelineContext>;
  readonly complete?: (
    context: PipelineContext,
  ) => PipelineContext | Promise<PipelineContext>;
  readonly cleanup?: (
    context: PipelineContext,
  ) => void | Promise<void>;
}

export class FunctionalPipelineStage implements PipelineStage {
  constructor(
    readonly name: PipelineStageName,
    private readonly lifecycle: PipelineStageLifecycle = {},
  ) {}

  async initialize(context: PipelineContext): Promise<PipelineContext> {
    return this.lifecycle.initialize?.(context) ?? context;
  }

  async validate(context: PipelineContext): Promise<void> {
    await this.lifecycle.validate?.(context);
  }

  async execute(context: PipelineContext): Promise<PipelineContext> {
    return this.lifecycle.execute?.(context) ?? context;
  }

  async complete(context: PipelineContext): Promise<PipelineContext> {
    return this.lifecycle.complete?.(context) ?? context;
  }

  async cleanup(context: PipelineContext): Promise<void> {
    await this.lifecycle.cleanup?.(context);
  }
}

export interface RuntimeDependencyResolution {
  readonly capabilities: readonly CapabilityEntry[];
  readonly manifests: readonly CapabilityManifest[];
}

export interface RuntimeDependencyResolver {
  resolve(
    capability: CapabilityEntry,
    manifest: CapabilityManifest,
  ): Promise<RuntimeDependencyResolution>;
}

export interface RuntimeValidator {
  validate(
    capability: CapabilityEntry,
    manifest: CapabilityManifest,
  ): Promise<void>;
}

export interface ExecutionResultWriter {
  write(result: CapabilityExecutionResult): Promise<void>;
}

export class InMemoryExecutionResultWriter implements ExecutionResultWriter {
  private readonly results = new Map<string, CapabilityExecutionResult>();

  async write(result: CapabilityExecutionResult): Promise<void> {
    if (this.results.has(result.executionId)) {
      throw new RuntimeFailureError(
        `Execution result "${result.executionId}" is already persisted.`,
        { executionId: result.executionId },
      );
    }
    this.results.set(result.executionId, freeze(structuredClone(result)));
  }

  get(executionId: string): CapabilityExecutionResult | null {
    return this.results.get(executionId) ?? null;
  }

  list(): readonly CapabilityExecutionResult[] {
    return freeze([...this.results.values()]);
  }
}

export class RegistryRuntimeDependencyResolver
  implements RuntimeDependencyResolver
{
  constructor(
    private readonly capabilities: CapabilityRegistry = capabilityRegistry,
    private readonly packs: ReadonlyRegistry<CapabilityPackEntry> =
      capabilityPackRegistry,
    private readonly runtimeApiVersion = "1.0.0",
  ) {}

  async resolve(
    capability: CapabilityEntry,
    manifest: CapabilityManifest,
  ): Promise<RuntimeDependencyResolution> {
    if (manifest.compatibility.runtimeApiVersion !== this.runtimeApiVersion) {
      throw new ManifestInvalidError(
        `Runtime API ${manifest.compatibility.runtimeApiVersion} is unsupported.`,
        {
          expected: this.runtimeApiVersion,
          actual: manifest.compatibility.runtimeApiVersion,
        },
      );
    }

    const resolved = new Map<string, CapabilityEntry>();
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (entry: CapabilityEntry): void => {
      if (visiting.has(entry.id)) {
        throw new DependencyResolutionFailedError(
          `Circular capability dependency detected at "${entry.id}".`,
          { capabilityId: entry.id },
        );
      }
      if (visited.has(entry.id)) return;
      visiting.add(entry.id);
      for (const dependencyId of entry.dependencies) {
        const dependency = this.capabilities.get(dependencyId);
        if (!dependency) {
          throw new DependencyResolutionFailedError(
            `Capability dependency "${dependencyId}" is not registered.`,
            { capabilityId: entry.id, dependencyId },
          );
        }
        visit(dependency);
        resolved.set(dependency.id, dependency);
      }
      visiting.delete(entry.id);
      visited.add(entry.id);
    };
    visit(capability);

    for (const dependencyId of manifest.requiredCapabilities) {
      const dependency = this.capabilities.get(dependencyId);
      if (!dependency) {
        throw new DependencyResolutionFailedError(
          `Manifest capability dependency "${dependencyId}" is not registered.`,
          { capabilityId: capability.id, dependencyId },
        );
      }
      visit(dependency);
      resolved.set(dependency.id, dependency);
    }

    const manifests: CapabilityManifest[] = [];
    for (const dependency of manifest.dependencies) {
      const release = this.packs
        .list()
        .find(
          (entry) =>
            entry.packId === dependency.packId &&
            satisfiesVersion(entry.packVersion, dependency.versionRange),
        );
      if (!release && !dependency.optional) {
        throw new DependencyResolutionFailedError(
          `Pack dependency "${dependency.packId}@${dependency.versionRange}" is unavailable.`,
          {
            capabilityId: capability.id,
            dependencyId: dependency.packId,
            versionRange: dependency.versionRange,
          },
        );
      }
      if (release) manifests.push(release.manifest);
    }

    return freeze({
      capabilities: [...resolved.values()].sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
      manifests: manifests.sort((left, right) =>
        `${left.id}@${left.version}`.localeCompare(
          `${right.id}@${right.version}`,
        ),
      ),
    });
  }
}

export class RegistryRuntimeValidator implements RuntimeValidator {
  constructor(
    private readonly runtimes: ReadonlyRegistry<RuntimeEntry> = runtimeRegistry,
    private readonly features: ReadonlyRegistry<FeatureEntry> = featureRegistry,
  ) {}

  async validate(
    capability: CapabilityEntry,
    manifest: CapabilityManifest,
  ): Promise<void> {
    if (capability.status !== "active") {
      throw new RuntimeFailureError(
        `Capability "${capability.id}" is not active.`,
        { capabilityId: capability.id, status: capability.status },
      );
    }
    if (
      capability.version !== manifest.version ||
      capability.id !== manifest.id
    ) {
      throw new ManifestInvalidError(
        "Capability metadata and manifest identity are incompatible.",
        {
          capabilityId: capability.id,
          capabilityVersion: capability.version,
          manifestId: manifest.id,
          manifestVersion: manifest.version,
        },
      );
    }
    const feature = this.features.get("universal_capability_runtime");
    if (!feature || feature.status === "planned" || feature.status === "deprecated") {
      throw new RuntimeFailureError(
        "Universal Capability Runtime feature is unavailable.",
      );
    }
    for (const runtimeId of [
      "universal_capability_runtime",
      "capability_execution_state_machine",
      "capability_execution_pipeline",
    ]) {
      const runtime = this.runtimes.get(runtimeId);
      if (
        !runtime ||
        runtime.status === "planned" ||
        runtime.status === "deprecated"
      ) {
        throw new RuntimeFailureError(
          `Required runtime "${runtimeId}" is unavailable.`,
          { runtimeId },
        );
      }
    }
  }
}

interface PipelineCoordinationResult {
  readonly context: PipelineContext;
  readonly stages: readonly PipelineStageResult[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly eventCount: number;
}

export class PipelineStageFailureError extends RuntimeFailureError {
  constructor(
    readonly stage: PipelineStageName,
    readonly pipelineContext: PipelineContext,
    readonly completedStages: readonly PipelineStageResult[],
    readonly pipelineStartedAt: string,
    readonly eventCount: number,
    cause: unknown,
  ) {
    super(
      `Pipeline stage "${stage}" failed: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
      { stage },
      { cause },
    );
  }
}

export class PipelineCoordinator {
  private eventCount = 0;

  constructor(
    private readonly eventBus: EventBus = new InMemoryEventBus(),
    private readonly telemetry: RuntimeTelemetry = new InMemoryRuntimeTelemetry(),
    private readonly runtimeVersion = UNIVERSAL_CAPABILITY_RUNTIME_VERSION,
  ) {}

  async run(
    initialContext: PipelineContext,
    stages: readonly PipelineStage[],
  ): Promise<PipelineCoordinationResult> {
    this.assertStageOrder(stages);
    this.eventCount = 0;
    const startedAt = new Date().toISOString();
    let context = initialContext;
    const results: PipelineStageResult[] = [];
    await this.emit(
      "capability.execution.pipeline.started",
      context,
      "pipeline",
    );

    for (const stage of stages) {
      const initializedAt = new Date().toISOString();
      await this.emit(
        "capability.execution.stage.started",
        context,
        stage.name,
      );
      let stageError: unknown;
      try {
        context = await stage.initialize(context);
        await stage.validate(context);
        context = await stage.execute(context);
        context = await stage.complete(context);
      } catch (error) {
        stageError = error;
      }
      try {
        await stage.cleanup(context);
      } catch (cleanupError) {
        stageError ??= cleanupError;
      }
      if (stageError) {
        await this.emit(
          "capability.execution.pipeline.failed",
          context,
          stage.name,
        );
        this.observePipeline(
          context,
          startedAt,
          "failed",
          stage.name,
        );
        throw new PipelineStageFailureError(
          stage.name,
          context,
          freeze([...results]),
          startedAt,
          this.eventCount,
          stageError,
        );
      }
      const completedAt = new Date().toISOString();
      const stageResult = freeze({
        stage: stage.name,
        initializedAt,
        completedAt,
        durationMs: Math.max(
          0,
          Date.parse(completedAt) - Date.parse(initializedAt),
        ),
        status: "completed" as const,
      });
      results.push(stageResult);
      this.telemetry.metric(
        "ucr.pipeline.stage.duration",
        stageResult.durationMs,
        "milliseconds",
        requestEventContext(context.request),
        { stage: stage.name, status: "completed" },
      );
      await this.emit(
        "capability.execution.stage.completed",
        context,
        stage.name,
      );
    }

    const completedAt = new Date().toISOString();
    await this.emit(
      "capability.execution.pipeline.completed",
      context,
      "pipeline",
    );
    this.observePipeline(context, startedAt, "completed", null);
    return freeze({
      context,
      stages: [...results],
      startedAt,
      completedAt,
      durationMs: Math.max(
        0,
        Date.parse(completedAt) - Date.parse(startedAt),
      ),
      eventCount: this.eventCount,
    });
  }

  private assertStageOrder(stages: readonly PipelineStage[]): void {
    const actual = stages.map((stage) => stage.name);
    if (
      actual.length !== CAPABILITY_EXECUTION_STAGE_ORDER.length ||
      actual.some(
        (stage, index) => stage !== CAPABILITY_EXECUTION_STAGE_ORDER[index],
      )
    ) {
      throw new RuntimeFailureError(
        "Capability execution stages do not match the canonical order.",
        { expected: CAPABILITY_EXECUTION_STAGE_ORDER, actual },
      );
    }
  }

  private observePipeline(
    context: PipelineContext,
    startedAt: string,
    status: "completed" | "failed",
    failureStage: PipelineStageName | null,
  ): void {
    const duration = Math.max(0, Date.now() - Date.parse(startedAt));
    this.telemetry.metric(
      "ucr.pipeline.duration",
      duration,
      "milliseconds",
      requestEventContext(context.request),
      {
        capabilityId: context.request.capabilityId,
        status,
        failureStage: failureStage ?? "none",
      },
    );
    this.telemetry.metric(
      "ucr.pipeline.events",
      this.eventCount,
      "count",
      requestEventContext(context.request),
      { status },
    );
  }

  private async emit(
    type: string,
    context: PipelineContext,
    stage: PipelineStageName | "pipeline",
  ): Promise<void> {
    this.eventCount += 1;
    await this.eventBus.publish(
      createBossEvent(
        type,
        freeze({
          executionId: context.executionId,
          stage,
          capabilityId: context.request.capabilityId,
          capabilityVersion: context.request.capabilityVersion,
          tenantId: context.request.tenantId,
          correlationId: context.request.correlationId,
          traceId: context.request.traceId,
          runtimeVersion: this.runtimeVersion,
          timestamp: new Date().toISOString(),
        }),
        requestEventContext(context.request),
      ),
    );
  }
}

export interface CapabilityExecutionPipelineOptions {
  readonly executor: CapabilityExecutor;
  readonly capabilityLoader?: CapabilityLoader;
  readonly manifestResolver?: ManifestResolver;
  readonly dependencyResolver?: RuntimeDependencyResolver;
  readonly contextResolver?: ContextResolver;
  readonly runtimeValidator?: RuntimeValidator;
  readonly evidenceWriter?: EvidenceWriter;
  readonly resultWriter?: ExecutionResultWriter;
  readonly runtime?: UniversalCapabilityRuntime;
  readonly coordinator?: PipelineCoordinator;
}

export class CapabilityExecutionPipeline {
  private readonly capabilityLoader: CapabilityLoader;
  private readonly manifestResolver: ManifestResolver;
  private readonly dependencyResolver: RuntimeDependencyResolver;
  private readonly contextResolver: ContextResolver;
  private readonly runtimeValidator: RuntimeValidator;
  private readonly evidenceWriter: EvidenceWriter;
  private readonly resultWriter: ExecutionResultWriter;
  private readonly runtime: UniversalCapabilityRuntime;
  private readonly coordinator: PipelineCoordinator;

  constructor(private readonly options: CapabilityExecutionPipelineOptions) {
    this.capabilityLoader =
      options.capabilityLoader ?? new RegistryCapabilityLoader();
    this.manifestResolver =
      options.manifestResolver ?? new RegistryManifestResolver();
    this.dependencyResolver =
      options.dependencyResolver ?? new RegistryRuntimeDependencyResolver();
    this.contextResolver =
      options.contextResolver ?? new DefaultContextResolver();
    this.runtimeValidator =
      options.runtimeValidator ?? new RegistryRuntimeValidator();
    this.evidenceWriter =
      options.evidenceWriter ?? new InMemoryEvidenceWriter();
    this.resultWriter =
      options.resultWriter ?? new InMemoryExecutionResultWriter();
    this.runtime = options.runtime ?? new UniversalCapabilityRuntime();
    this.coordinator = options.coordinator ?? new PipelineCoordinator();
  }

  async execute(
    request: CapabilityExecutionRequest,
  ): Promise<PipelineResult> {
    const initialContext: PipelineContext = freeze({
      executionId: randomUUID(),
      request: structuredClone(request),
      capability: null,
      manifest: null,
      dependencies: [],
      resolvedContext: null,
      execution: null,
      result: null,
      evidenceIds: [],
    });

    try {
      const coordinated = await this.coordinator.run(
        initialContext,
        this.createStages(),
      );
      const status = coordinated.context.result?.state ?? "failed";
      return freeze({
        executionId: coordinated.context.executionId,
        status,
        execution: coordinated.context.execution,
        result: coordinated.context.result,
        stages: coordinated.stages,
        startedAt: coordinated.startedAt,
        completedAt: coordinated.completedAt,
        durationMs: coordinated.durationMs,
        eventCount: coordinated.eventCount,
        failureStage: null,
        error: null,
      });
    } catch (error) {
      if (!(error instanceof PipelineStageFailureError)) throw error;
      let execution = error.pipelineContext.execution;
      if (
        execution &&
        !["completed", "failed", "cancelled"].includes(execution.state)
      ) {
        execution = await this.runtime.transition(
          execution,
          "failed",
          error.cause instanceof Error ? error.cause.message : error.message,
        );
      }
      const cause = error.cause;
      const code =
        cause instanceof UniversalCapabilityRuntimeError
          ? cause.code
          : "RUNTIME_FAILURE";
      const completedAt = new Date().toISOString();
      return freeze({
        executionId: error.pipelineContext.executionId,
        status: "failed" as const,
        execution,
        result: error.pipelineContext.result,
        stages: error.completedStages,
        startedAt: error.pipelineStartedAt,
        completedAt,
        durationMs: Math.max(
          0,
          Date.parse(completedAt) - Date.parse(error.pipelineStartedAt),
        ),
        eventCount: error.eventCount,
        failureStage: error.stage,
        error: {
          code,
          message: cause instanceof Error ? cause.message : String(cause),
        },
      });
    }
  }

  private createStages(): readonly PipelineStage[] {
    return freeze([
      new FunctionalPipelineStage("request", {
        validate: (context) => {
          const values = [
            context.request.tenantId,
            context.request.organizationId,
            context.request.userId,
            context.request.capabilityId,
            context.request.capabilityVersion,
            context.request.correlationId,
            context.request.traceId,
          ];
          if (values.some((value) => !value.trim())) {
            throw new ManifestInvalidError(
              "Capability execution request is incomplete.",
            );
          }
        },
      }),
      new FunctionalPipelineStage("resolve_capability", {
        execute: async (context) =>
          freeze({
            ...context,
            capability: await this.capabilityLoader.load(
              context.request.capabilityId,
            ),
          }),
      }),
      new FunctionalPipelineStage("load_manifest", {
        execute: async (context) =>
          freeze({
            ...context,
            manifest: await this.manifestResolver.resolve(
              context.request.capabilityId,
              context.request.capabilityVersion,
            ),
          }),
      }),
      new FunctionalPipelineStage("resolve_dependencies", {
        validate: (context) => {
          this.assertResolved(context, "capability", "manifest");
        },
        execute: async (context) => {
          const resolution = await this.dependencyResolver.resolve(
            context.capability!,
            context.manifest!,
          );
          return freeze({
            ...context,
            dependencies: resolution.capabilities,
          });
        },
      }),
      new FunctionalPipelineStage("build_context", {
        validate: (context) => {
          this.assertResolved(context, "manifest");
        },
        execute: async (context) =>
          freeze({
            ...context,
            resolvedContext: await this.contextResolver.resolve(
              context.request,
              context.manifest!,
            ),
          }),
      }),
      new FunctionalPipelineStage("validate_runtime", {
        validate: (context) => {
          this.assertResolved(context, "capability", "manifest");
          this.assertResolved(context, "resolvedContext");
        },
        execute: async (context) => {
          await this.runtimeValidator.validate(
            context.capability!,
            context.manifest!,
          );
          return context;
        },
      }),
      new FunctionalPipelineStage("create_session", {
        execute: async (context) => {
          let execution = await this.runtime.createExecution(
            context.resolvedContext!,
            context.executionId,
          );
          execution = await this.runtime.transition(
            execution,
            "initializing",
          );
          execution = await this.runtime.transition(execution, "validating");
          execution = await this.runtime.transition(execution, "ready");
          return freeze({ ...context, execution });
        },
      }),
      new FunctionalPipelineStage("execute_capability", {
        validate: (context) => {
          this.assertResolved(context, "execution");
        },
        execute: async (context) => {
          const running = await this.runtime.transition(
            context.execution!,
            "running",
          );
          const result = await this.options.executor.execute(running);
          if (
            result.executionId !== context.executionId ||
            !["completed", "failed", "cancelled"].includes(result.state)
          ) {
            throw new RuntimeFailureError(
              "Capability executor returned an invalid result.",
              { executionId: context.executionId },
            );
          }
          return freeze({ ...context, execution: running, result });
        },
      }),
      new FunctionalPipelineStage("collect_evidence", {
        validate: (context) => {
          this.assertResolved(context, "execution", "result");
        },
        execute: async (context) => {
          const pipelineEvidenceId = await this.evidenceWriter.write(
            context.execution!,
            {
              resultState: context.result!.state,
              capabilityId: context.request.capabilityId,
            },
          );
          return freeze({
            ...context,
            evidenceIds: [
              ...new Set([
                ...context.result!.evidenceIds,
                pipelineEvidenceId,
              ]),
            ],
          });
        },
      }),
      new FunctionalPipelineStage("persist_result", {
        validate: (context) => {
          this.assertResolved(context, "result");
        },
        execute: async (context) => {
          const persistedResult = freeze({
            ...context.result!,
            evidenceIds: context.evidenceIds,
          });
          await this.resultWriter.write(persistedResult);
          return freeze({ ...context, result: persistedResult });
        },
      }),
      new FunctionalPipelineStage("publish_events"),
      new FunctionalPipelineStage("finalize_session", {
        validate: (context) => {
          this.assertResolved(context, "execution", "result");
        },
        execute: async (context) => {
          const target = context.result!.state;
          const execution = await this.runtime.transition(
            context.execution!,
            target,
            context.result!.error?.message ?? null,
          );
          const result = freeze({
            ...context.result!,
            completedAt:
              execution.metadata.completedAt ??
              context.result!.completedAt,
            durationMs:
              execution.metadata.durationMs ??
              context.result!.durationMs,
          });
          return freeze({ ...context, execution, result });
        },
      }),
    ]);
  }

  private assertResolved(
    context: PipelineContext,
    ...fields: readonly (
      | "capability"
      | "manifest"
      | "resolvedContext"
      | "execution"
      | "result"
    )[]
  ): void {
    for (const field of fields) {
      if (!context[field]) {
        throw new RuntimeFailureError(
          `Pipeline context is missing "${field}".`,
          { field },
        );
      }
    }
  }
}
