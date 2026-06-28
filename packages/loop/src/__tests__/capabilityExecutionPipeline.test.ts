import type { BossEvent } from "@boss/events";
import { InMemoryEventBus } from "@boss/events";
import {
  createReadonlyRegistry,
  type CapabilityEntry,
  type CapabilityPackEntry,
  type CapabilityRegistry,
  type FeatureEntry,
  type RuntimeEntry,
} from "@boss/registries";
import type {
  CapabilityExecution,
  CapabilityExecutionRequest,
  CapabilityExecutionResult,
  CapabilityManifest,
} from "@boss/types";
import { describe, expect, it } from "vitest";
import {
  CAPABILITY_EXECUTION_STAGE_ORDER,
  CapabilityExecutionPipeline,
  DefaultContextResolver,
  FunctionalPipelineStage,
  InMemoryEvidenceWriter,
  InMemoryExecutionResultWriter,
  InMemoryRuntimeTelemetry,
  ManifestInvalidError,
  PipelineCoordinator,
  RegistryCapabilityLoader,
  RegistryManifestResolver,
  RegistryRuntimeDependencyResolver,
  RegistryRuntimeValidator,
  RuntimeFailureError,
  UniversalCapabilityRuntime,
  type CapabilityExecutor,
  type PipelineContext,
  type PipelineStage,
} from "../index.js";

function manifest(
  id = "generic-capability",
  overrides: Partial<CapabilityManifest> = {},
): CapabilityManifest {
  return {
    schemaVersion: "1.0.0",
    id,
    name: id,
    version: "1.0.0",
    description: `${id} test manifest`,
    type: "diagnostic",
    dependencies: [],
    compatibility: {
      platformVersionRange: "^1.0.0",
      runtimeApiVersion: "1.0.0",
    },
    requiredCapabilities: [],
    requiredPermissions: ["capability.execute"],
    eventsPublished: [],
    eventsConsumed: [],
    registriesUsed: ["runtime_registry"],
    entrypoint: "index.js",
    metadata: {},
    ...overrides,
  };
}

function capability(
  id = "generic-capability",
  dependencies: readonly string[] = [],
): CapabilityEntry {
  return {
    id,
    name: id,
    displayName: id,
    key: id,
    label: id,
    description: `${id} test capability`,
    category: "system",
    subcategory: "runtime",
    businessDomain: "platform",
    supportedIndustries: ["all"],
    requiredInputs: [],
    generatedOutputs: [],
    dependencies,
    requiredPermissions: ["capability.execute"],
    executionMode: ["manual"],
    riskLevel: "low",
    complexity: "low",
    owner: "Platform",
    version: "1.0.0",
    status: "active",
    tags: ["test"],
  };
}

function capabilityStore(
  entries: readonly CapabilityEntry[],
): CapabilityRegistry {
  const values = new Map(entries.map((entry) => [entry.key, entry]));
  return {
    list: () => Object.freeze([...values.values()]),
    get: (key) => values.get(key),
    register: (entry) => {
      if (values.has(entry.key)) throw new Error("duplicate");
      values.set(entry.key, entry);
    },
  };
}

function registerManifest(
  registry: ReturnType<
    typeof createReadonlyRegistry<CapabilityPackEntry>
  >,
  value: CapabilityManifest,
): void {
  registry.register({
    id: `${value.id}@${value.version}`,
    displayName: value.name,
    key: `${value.id}@${value.version}`,
    label: value.name,
    packId: value.id,
    packVersion: value.version,
    type: value.type,
    manifest: value,
    manifestDigest: `digest-${value.id}`,
    signature: {
      algorithm: "ed25519",
      keyId: "test-key",
      manifestDigest: `digest-${value.id}`,
      value: "signature",
      signedAt: new Date().toISOString(),
    },
    owner: "Platform",
    version: value.version,
    status: "published",
    documentation: "README.md",
  });
}

function runtimeRegistries(): {
  runtimes: ReturnType<typeof createReadonlyRegistry<RuntimeEntry>>;
  features: ReturnType<typeof createReadonlyRegistry<FeatureEntry>>;
} {
  const runtimes = createReadonlyRegistry<RuntimeEntry>();
  for (const id of [
    "universal_capability_runtime",
    "capability_execution_state_machine",
    "capability_execution_pipeline",
  ]) {
    runtimes.register({
      id,
      displayName: id,
      key: id,
      label: id,
      kind: "capability",
      implementationPackage: "@boss/loop",
      owner: "Platform",
      version: "0.1.0",
      status: "internal_alpha",
      documentation: "packages/loop",
    });
  }
  const features = createReadonlyRegistry<FeatureEntry>();
  features.register({
    id: "universal_capability_runtime",
    displayName: "Universal Capability Runtime",
    key: "universal_capability_runtime",
    label: "Universal Capability Runtime",
    description: "Test feature",
    sourcePaths: ["packages/loop"],
    owner: "Platform",
    version: "0.1.0",
    status: "internal_alpha",
  });
  return { runtimes, features };
}

function request(
  overrides: Partial<CapabilityExecutionRequest> = {},
): CapabilityExecutionRequest {
  return {
    tenantId: "tenant-a",
    organizationId: "org-a",
    userId: "user-a",
    capabilityId: "generic-capability",
    capabilityVersion: "1.0.0",
    featureFlags: { ucr: true },
    permissions: ["capability.execute"],
    requestId: "request-a",
    correlationId: "correlation-a",
    traceId: "trace-a",
    ...overrides,
  };
}

function completedResult(
  execution: CapabilityExecution,
  state: CapabilityExecutionResult["state"] = "completed",
): CapabilityExecutionResult {
  return {
    executionId: execution.id,
    state,
    value: state === "completed" ? { handled: true } : null,
    evidenceIds: ["executor-evidence"],
    completedAt: new Date().toISOString(),
    durationMs: 1,
    error:
      state === "failed"
        ? { code: "ADAPTER_FAILURE", message: "Adapter failed." }
        : null,
  };
}

interface Harness {
  pipeline: CapabilityExecutionPipeline;
  events: BossEvent[];
  telemetry: InMemoryRuntimeTelemetry;
  results: InMemoryExecutionResultWriter;
  evidence: InMemoryEvidenceWriter;
  seenExecutions: CapabilityExecution[];
}

function harness(
  executor?: CapabilityExecutor,
  root = capability(),
  entries: readonly CapabilityEntry[] = [root],
  rootManifest = manifest(),
): Harness {
  const capabilities = capabilityStore(entries);
  const manifests = createReadonlyRegistry<CapabilityPackEntry>();
  registerManifest(manifests, rootManifest);
  const registries = runtimeRegistries();
  const events: BossEvent[] = [];
  const bus = new InMemoryEventBus();
  bus.subscribe("*", (event) => {
    events.push(event);
  });
  const telemetry = new InMemoryRuntimeTelemetry();
  const results = new InMemoryExecutionResultWriter();
  const evidence = new InMemoryEvidenceWriter();
  const seenExecutions: CapabilityExecution[] = [];
  const capabilityExecutor =
    executor ??
    ({
      execute: async (execution: CapabilityExecution) => {
        seenExecutions.push(execution);
        return completedResult(execution);
      },
    } satisfies CapabilityExecutor);

  return {
    events,
    telemetry,
    results,
    evidence,
    seenExecutions,
    pipeline: new CapabilityExecutionPipeline({
      executor: capabilityExecutor,
      capabilityLoader: new RegistryCapabilityLoader(capabilities),
      manifestResolver: new RegistryManifestResolver(manifests),
      dependencyResolver: new RegistryRuntimeDependencyResolver(
        capabilities,
        manifests,
      ),
      contextResolver: new DefaultContextResolver(),
      runtimeValidator: new RegistryRuntimeValidator(
        registries.runtimes,
        registries.features,
      ),
      evidenceWriter: evidence,
      resultWriter: results,
      runtime: new UniversalCapabilityRuntime({
        eventBus: bus,
        telemetry,
      }),
      coordinator: new PipelineCoordinator(bus, telemetry),
    }),
  };
}

describe("CapabilityExecutionPipeline", () => {
  it("executes the canonical stages in order and finalizes immutable state", async () => {
    const testHarness = harness();
    const result = await testHarness.pipeline.execute(request());

    expect(result.status).toBe("completed");
    expect(result.stages.map((stage) => stage.stage)).toEqual(
      CAPABILITY_EXECUTION_STAGE_ORDER,
    );
    expect(result.stages.every(Object.isFrozen)).toBe(true);
    expect(result.execution).toEqual(
      expect.objectContaining({
        id: result.executionId,
        state: "completed",
      }),
    );
    expect(result.execution?.session.closedAt).not.toBeNull();
    expect(testHarness.seenExecutions).toHaveLength(1);
    expect(testHarness.seenExecutions[0]?.state).toBe("running");
    expect(testHarness.results.get(result.executionId)).toEqual(
      expect.objectContaining({
        executionId: result.executionId,
        state: "completed",
        evidenceIds: expect.arrayContaining([
          "executor-evidence",
          expect.any(String),
        ]),
      }),
    );
    expect(testHarness.evidence.list()).toHaveLength(1);
    expect(result.eventCount).toBe(26);

    const pipelineEvents = testHarness.events.filter((event) =>
      event.type.includes(".pipeline."),
    );
    expect(pipelineEvents.map((event) => event.type)).toEqual([
      "capability.execution.pipeline.started",
      "capability.execution.pipeline.completed",
    ]);
    expect(
      testHarness.events.filter(
        (event) => event.type === "capability.execution.stage.started",
      ),
    ).toHaveLength(12);
    expect(
      testHarness.events.filter(
        (event) => event.type === "capability.execution.stage.completed",
      ),
    ).toHaveLength(12);
    expect(testHarness.events[0]?.payload).toEqual(
      expect.objectContaining({
        executionId: result.executionId,
        stage: "pipeline",
        capabilityId: "generic-capability",
        capabilityVersion: "1.0.0",
        tenantId: "tenant-a",
        runtimeVersion: "0.1.0",
      }),
    );
    expect(
      testHarness.telemetry.metrics().map((metric) => metric.name),
    ).toEqual(
      expect.arrayContaining([
        "ucr.pipeline.stage.duration",
        "ucr.pipeline.duration",
        "ucr.pipeline.events",
      ]),
    );
  });

  it("runs all five stage lifecycle hooks deterministically", async () => {
    const calls: string[] = [];
    const initial = {
      executionId: "execution-a",
      request: request(),
      capability: null,
      manifest: null,
      dependencies: [],
      resolvedContext: null,
      execution: null,
      result: null,
      evidenceIds: [],
    } satisfies PipelineContext;
    const stage = new FunctionalPipelineStage("request", {
      initialize: (context) => {
        calls.push("initialize");
        return context;
      },
      validate: () => {
        calls.push("validate");
      },
      execute: (context) => {
        calls.push("execute");
        return context;
      },
      complete: (context) => {
        calls.push("complete");
        return context;
      },
      cleanup: () => {
        calls.push("cleanup");
      },
    });

    let context = await stage.initialize(initial);
    await stage.validate(context);
    context = await stage.execute(context);
    context = await stage.complete(context);
    await stage.cleanup(context);
    expect(calls).toEqual([
      "initialize",
      "validate",
      "execute",
      "complete",
      "cleanup",
    ]);
  });

  it("rejects missing, cyclic, and incompatible dependencies", async () => {
    const manifests = createReadonlyRegistry<CapabilityPackEntry>();
    const rootManifest = manifest();
    registerManifest(manifests, rootManifest);

    await expect(
      new RegistryRuntimeDependencyResolver(
        capabilityStore([capability("root", ["missing"])]),
        manifests,
      ).resolve(capability("root", ["missing"]), manifest("root")),
    ).rejects.toEqual(
      expect.objectContaining({ code: "DEPENDENCY_RESOLUTION_FAILED" }),
    );

    const left = capability("left", ["right"]);
    const right = capability("right", ["left"]);
    await expect(
      new RegistryRuntimeDependencyResolver(
        capabilityStore([left, right]),
        manifests,
      ).resolve(left, manifest("left")),
    ).rejects.toThrow("Circular capability dependency");

    await expect(
      new RegistryRuntimeDependencyResolver(
        capabilityStore([capability()]),
        manifests,
      ).resolve(
        capability(),
        manifest("generic-capability", {
          compatibility: {
            platformVersionRange: "^1.0.0",
            runtimeApiVersion: "2.0.0",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ManifestInvalidError);

    await expect(
      new RegistryRuntimeDependencyResolver(
        capabilityStore([capability()]),
        manifests,
      ).resolve(
        capability(),
        manifest("generic-capability", {
          dependencies: [
            {
              packId: "missing-pack",
              versionRange: "^1.0.0",
              optional: false,
            },
          ],
        }),
      ),
    ).rejects.toThrow("Pack dependency");
  });

  it("propagates validation and executor failures through typed pipeline results", async () => {
    const permissionFailure = await harness().pipeline.execute(
      request({ permissions: [] }),
    );
    expect(permissionFailure).toEqual(
      expect.objectContaining({
        status: "failed",
        failureStage: "build_context",
        execution: null,
        error: expect.objectContaining({ code: "PERMISSION_DENIED" }),
      }),
    );

    const failingHarness = harness({
      execute: async () => {
        throw new RuntimeFailureError("Generic adapter failed.");
      },
    });
    const executionFailure = await failingHarness.pipeline.execute(request());
    expect(executionFailure).toEqual(
      expect.objectContaining({
        status: "failed",
        failureStage: "execute_capability",
        error: expect.objectContaining({ code: "RUNTIME_FAILURE" }),
      }),
    );
    expect(executionFailure.execution?.state).toBe("failed");
    expect(
      failingHarness.events.map((event) => event.type),
    ).toEqual(
      expect.arrayContaining([
        "capability.execution.pipeline.failed",
        "capability.execution.failed",
      ]),
    );
  });

  it("supports controlled cancellation without retry or replay", async () => {
    const cancelledHarness = harness({
      execute: async (execution) =>
        completedResult(execution, "cancelled"),
    });
    const result = await cancelledHarness.pipeline.execute(request());

    expect(result.status).toBe("cancelled");
    expect(result.execution?.state).toBe("cancelled");
    expect(result.failureStage).toBeNull();
    expect(
      cancelledHarness.events.map((event) => event.type),
    ).not.toContain("capability.execution.failed");
  });

  it("rejects noncanonical stage ordering before execution", async () => {
    const coordinator = new PipelineCoordinator();
    const initial: PipelineContext = {
      executionId: "execution-a",
      request: request(),
      capability: null,
      manifest: null,
      dependencies: [],
      resolvedContext: null,
      execution: null,
      result: null,
      evidenceIds: [],
    };
    const stages: PipelineStage[] = [
      new FunctionalPipelineStage("request"),
    ];
    await expect(coordinator.run(initial, stages)).rejects.toBeInstanceOf(
      RuntimeFailureError,
    );
  });

  it("runs cleanup and identifies the exact failed stage", async () => {
    const calls: string[] = [];
    const stages = CAPABILITY_EXECUTION_STAGE_ORDER.map(
      (name): PipelineStage =>
        new FunctionalPipelineStage(name, {
          execute: (context) => {
            calls.push(`execute:${name}`);
            if (name === "validate_runtime") {
              throw new Error("validation exploded");
            }
            return context;
          },
          cleanup: () => {
            calls.push(`cleanup:${name}`);
          },
        }),
    );
    const initial: PipelineContext = {
      executionId: "execution-a",
      request: request(),
      capability: null,
      manifest: null,
      dependencies: [],
      resolvedContext: null,
      execution: null,
      result: null,
      evidenceIds: [],
    };
    await expect(
      new PipelineCoordinator().run(initial, stages),
    ).rejects.toEqual(
      expect.objectContaining({ stage: "validate_runtime" }),
    );
    expect(calls).toContain("cleanup:validate_runtime");
    expect(calls).not.toContain("execute:create_session");
  });
});
