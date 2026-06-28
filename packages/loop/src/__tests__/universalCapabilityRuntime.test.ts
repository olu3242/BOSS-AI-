import type { BossEvent } from "@boss/events";
import { InMemoryEventBus } from "@boss/events";
import {
  createReadonlyRegistry,
  seedCoreRegistries,
  featureRegistry,
  runtimeRegistry,
  eventRegistry,
  type CapabilityEntry,
  type CapabilityPackEntry,
  type CapabilityRegistry,
} from "@boss/registries";
import type {
  CapabilityExecutionContext,
  CapabilityExecutionRequest,
  CapabilityManifest,
} from "@boss/types";
import { describe, expect, it } from "vitest";
import {
  CapabilityExecutionStateMachine,
  CapabilityNotFoundError,
  DefaultContextResolver,
  DependencyResolutionFailedError,
  InMemoryEvidenceWriter,
  InMemoryRuntimeTelemetry,
  InvalidExecutionStateError,
  ManifestInvalidError,
  PermissionDeniedError,
  RegistryCapabilityLoader,
  RegistryDependencyResolver,
  RegistryManifestResolver,
  RuntimeFailureError,
  UniversalCapabilityRuntime,
  UnsupportedCapabilityExecutor,
} from "../index.js";

function manifest(
  id = "test-capability",
  version = "1.0.0",
  requiredPermissions: readonly string[] = ["capability.execute"],
): CapabilityManifest {
  return {
    schemaVersion: "1.0.0",
    id,
    name: "Test Capability",
    version,
    description: "A capability used to validate the UCR core.",
    type: "diagnostic",
    dependencies: [],
    compatibility: {
      platformVersionRange: "^1.0.0",
      runtimeApiVersion: "1.0.0",
    },
    requiredCapabilities: [],
    requiredPermissions,
    eventsPublished: [],
    eventsConsumed: [],
    registriesUsed: ["runtime_registry"],
    entrypoint: "index.js",
    metadata: {},
  };
}

function request(
  capabilityId = "test-capability",
  capabilityVersion = "1.0.0",
): CapabilityExecutionRequest {
  return {
    tenantId: "tenant-a",
    organizationId: "org-a",
    userId: "user-a",
    capabilityId,
    capabilityVersion,
    featureFlags: { ucr: true },
    permissions: ["capability.execute"],
    requestId: "request-a",
    correlationId: "correlation-a",
    traceId: "trace-a",
  };
}

async function context(): Promise<CapabilityExecutionContext> {
  return new DefaultContextResolver().resolve(request(), manifest());
}

function capability(
  id: string,
  dependencies: readonly string[] = [],
): CapabilityEntry {
  return {
    id,
    name: id,
    displayName: id,
    key: id,
    label: id,
    description: `${id} capability`,
    category: "system",
    subcategory: "runtime",
    businessDomain: "platform",
    supportedIndustries: ["all"],
    requiredInputs: [],
    generatedOutputs: [],
    dependencies,
    requiredPermissions: [],
    executionMode: ["manual"],
    riskLevel: "low",
    complexity: "low",
    owner: "Platform",
    version: "1.0.0",
    status: "active",
    tags: ["test"],
  };
}

function capabilityRegistry(
  entries: readonly CapabilityEntry[],
): CapabilityRegistry {
  const values = new Map(entries.map((entry) => [entry.key, entry]));
  return {
    list: () => Object.freeze([...values.values()]),
    get: (key) => values.get(key),
    register: (entry) => {
      values.set(entry.key, entry);
    },
  };
}

describe("Universal Capability Runtime core", () => {
  it("creates immutable context and enforces manifest permissions", async () => {
    const resolver = new DefaultContextResolver();
    const sourceManifest = manifest();
    const resolved = await resolver.resolve(request(), sourceManifest);

    expect(resolved.manifest).toEqual(sourceManifest);
    expect(resolved.manifest).not.toBe(sourceManifest);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.featureFlags)).toBe(true);
    expect(Object.isFrozen(resolved.manifest)).toBe(true);
    expect(Object.isFrozen(sourceManifest)).toBe(false);

    await expect(
      resolver.resolve(
        { ...request(), permissions: [] },
        sourceManifest,
      ),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      resolver.resolve(request(), manifest("another-capability")),
    ).rejects.toBeInstanceOf(ManifestInvalidError);
  });

  it("enforces deterministic transitions and emits observable lifecycle events", async () => {
    const bus = new InMemoryEventBus();
    const telemetry = new InMemoryRuntimeTelemetry();
    const events: BossEvent[] = [];
    bus.subscribe("*", (event) => {
      events.push(event);
    });
    const runtime = new UniversalCapabilityRuntime({
      eventBus: bus,
      telemetry,
    });

    let execution = await runtime.createExecution(await context());
    expect(Object.isFrozen(execution)).toBe(true);
    expect(execution.state).toBe("pending");

    for (const state of [
      "initializing",
      "validating",
      "ready",
      "running",
      "completed",
    ] as const) {
      execution = await runtime.transition(execution, state);
    }

    expect(execution.state).toBe("completed");
    expect(execution.session.closedAt).not.toBeNull();
    expect(execution.metadata.transitions).toHaveLength(5);
    expect(execution.metadata.durationMs).not.toBeNull();
    expect(events.map((event) => event.type)).toEqual([
      "capability.execution.created",
      "capability.execution.started",
      "capability.execution.completed",
    ]);
    expect(events[0]?.payload).toEqual(
      expect.objectContaining({
        executionId: execution.id,
        capabilityId: "test-capability",
        tenantId: "tenant-a",
        correlationId: "correlation-a",
        traceId: "trace-a",
        runtimeVersion: "0.1.0",
      }),
    );
    expect(telemetry.logs()).toHaveLength(5);
    expect(telemetry.metrics().map((metric) => metric.name)).toContain(
      "ucr.execution.duration",
    );

    await expect(
      runtime.transition(execution, "running"),
    ).rejects.toBeInstanceOf(InvalidExecutionStateError);
  });

  it("records typed failures and retry observations without executing business logic", async () => {
    const bus = new InMemoryEventBus();
    const events: BossEvent[] = [];
    bus.subscribe("*", (event) => {
      events.push(event);
    });
    const runtime = new UniversalCapabilityRuntime({ eventBus: bus });
    let execution = await runtime.createExecution(await context());
    execution = await runtime.transition(execution, "initializing");
    execution = await runtime.transition(execution, "validating");
    execution = await runtime.transition(execution, "ready");
    execution = await runtime.transition(execution, "running");
    execution = await runtime.transition(execution, "retrying");
    execution = await runtime.transition(execution, "running");
    execution = await runtime.transition(
      execution,
      "failed",
      "Adapter failed.",
    );

    expect(execution.metadata.retryCount).toBe(1);
    expect(execution.metadata.failureReason).toBe("Adapter failed.");
    expect(events.at(-1)?.type).toBe("capability.execution.failed");
    await expect(
      new UnsupportedCapabilityExecutor().execute(execution),
    ).rejects.toBeInstanceOf(RuntimeFailureError);
  });

  it("provides fail-closed registry adapters and immutable evidence", async () => {
    const dependency = capability("dependency");
    const root = capability("root", ["dependency"]);
    const registry = capabilityRegistry([root, dependency]);
    const loader = new RegistryCapabilityLoader(registry);
    const resolver = new RegistryDependencyResolver(registry);

    expect(await loader.load("root")).toBe(root);
    expect(await resolver.resolve(root)).toEqual([dependency]);
    await expect(loader.load("missing")).rejects.toBeInstanceOf(
      CapabilityNotFoundError,
    );
    await expect(
      new RegistryDependencyResolver(
        capabilityRegistry([capability("broken", ["missing"])]),
      ).resolve(capability("broken", ["missing"])),
    ).rejects.toBeInstanceOf(DependencyResolutionFailedError);

    const manifests = createReadonlyRegistry<CapabilityPackEntry>();
    const packManifest = manifest("root");
    manifests.register({
      id: "root@1.0.0",
      displayName: "Root",
      key: "root@1.0.0",
      label: "Root",
      packId: "root",
      packVersion: "1.0.0",
      type: "diagnostic",
      manifest: packManifest,
      manifestDigest: "digest",
      signature: {
        algorithm: "ed25519",
        keyId: "key",
        manifestDigest: "digest",
        value: "signature",
        signedAt: new Date().toISOString(),
      },
      owner: "Platform",
      version: "1.0.0",
      status: "published",
      documentation: "README.md",
    });
    expect(
      await new RegistryManifestResolver(manifests).resolve("root", "1.0.0"),
    ).toBe(packManifest);
    await expect(
      new RegistryManifestResolver(manifests).resolve("root", "2.0.0"),
    ).rejects.toBeInstanceOf(ManifestInvalidError);

    const runtime = new UniversalCapabilityRuntime();
    const execution = await runtime.createExecution(await context());
    const writer = new InMemoryEvidenceWriter();
    await writer.write(execution, { source: "test" });
    expect(writer.list()).toEqual([
      { executionId: execution.id, evidence: { source: "test" } },
    ]);
    expect(Object.isFrozen(writer.list()[0])).toBe(true);
  });

  it("registers UCR core and pipeline metadata at their certified status", () => {
    seedCoreRegistries();
    expect(featureRegistry.get("universal_capability_runtime")).toEqual(
      expect.objectContaining({ status: "internal_alpha" }),
    );
    expect(runtimeRegistry.get("universal_capability_runtime")).toEqual(
      expect.objectContaining({
        implementationPackage: "@boss/loop",
        status: "internal_alpha",
      }),
    );
    expect(
      runtimeRegistry.get("capability_execution_state_machine"),
    ).toEqual(expect.objectContaining({ status: "internal_alpha" }));
    expect(runtimeRegistry.get("capability_execution_pipeline")).toEqual(
      expect.objectContaining({ status: "internal_alpha" }),
    );
    for (const eventId of [
      "capability.execution.created",
      "capability.execution.started",
      "capability.execution.completed",
      "capability.execution.failed",
    ]) {
      expect(eventRegistry.get(eventId)).toBeDefined();
    }
  });

  it("rejects every unsupported state edge", () => {
    const machine = new CapabilityExecutionStateMachine();
    expect(machine.canTransition("pending", "initializing")).toBe(true);
    expect(machine.canTransition("pending", "running")).toBe(false);
    expect(() => machine.assertTransition("pending", "running")).toThrow(
      InvalidExecutionStateError,
    );
    expect(() => machine.assertTransition("completed", "completed")).toThrow(
      InvalidExecutionStateError,
    );
  });
});
