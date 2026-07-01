import {
  generateKeyPairSync,
  sign,
  type KeyObject,
} from "node:crypto";
import type { BossEvent, EventContext } from "@boss/events";
import { InMemoryEventBus } from "@boss/events";
import type {
  CapabilityManifest,
  CapabilitySignature,
} from "@boss/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CapabilityPackPlatform,
  InMemoryCapabilityTrustStore,
  digestManifest,
  type CapabilityPackModule,
} from "../index.js";

const allowedRegistries = new Set([
  "runtime_registry",
  "feature_registry",
  "event_registry",
]);

function context(orgId = "org-a"): EventContext {
  return {
    orgId,
    actorId: "user-owner",
    requestId: "request-1",
    correlationId: "correlation-1",
    traceId: "trace-1",
  };
}

function manifest(
  id: string,
  version = "1.0.0",
  overrides: Partial<CapabilityManifest> = {},
): CapabilityManifest {
  return {
    schemaVersion: "1.0.0",
    id,
    name: `${id} pack`,
    version,
    description: `A test capability pack for ${id}.`,
    type: "diagnostic",
    dependencies: [],
    compatibility: {
      platformVersionRange: "^1.0.0",
      runtimeApiVersion: "1.0.0",
    },
    requiredCapabilities: [],
    requiredPermissions: [],
    eventsPublished: ["test.capability.completed"],
    eventsConsumed: [],
    registriesUsed: ["runtime_registry"],
    entrypoint: "README.md",
    metadata: {},
    ...overrides,
  };
}

function signatureFor(
  value: CapabilityManifest,
  privateKey: KeyObject,
  keyId = "test-release-key",
): CapabilitySignature {
  const digest = digestManifest(value);
  return {
    algorithm: "ed25519",
    keyId,
    manifestDigest: digest,
    value: sign(null, Buffer.from(digest, "hex"), privateKey).toString(
      "base64",
    ),
    signedAt: new Date().toISOString(),
  };
}

describe("CapabilityPackPlatform", () => {
  let privateKey: KeyObject;
  let trustStore: InMemoryCapabilityTrustStore;
  let eventBus: InMemoryEventBus;
  let events: BossEvent[];
  let platform: CapabilityPackPlatform;

  beforeEach(() => {
    const keys = generateKeyPairSync("ed25519");
    privateKey = keys.privateKey;
    trustStore = new InMemoryCapabilityTrustStore();
    trustStore.trust(
      "test-release-key",
      keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
    );
    events = [];
    eventBus = new InMemoryEventBus();
    eventBus.subscribe("*", (event) => {
      events.push(event);
    });
    platform = new CapabilityPackPlatform({
      platformVersion: "1.4.0",
      runtimeApiVersion: "1.0.0",
      allowedRegistries,
      trustStore,
      eventBus,
    });
  });

  async function publish(
    value: CapabilityManifest,
    module: CapabilityPackModule,
  ): Promise<void> {
    platform.loader.register(module);
    await platform.registerDraft(value, context());
    await platform.build(value.id, value.version, context());
    const report = await platform.validate(value.id, value.version, context());
    expect(report.valid).toBe(true);
    await platform.attachSignature(
      value.id,
      value.version,
      signatureFor(value, privateKey),
      context(),
    );
    await platform.publish(value.id, value.version, context());
  }

  it("installs, activates, upgrades, rolls back, and removes signed packs", async () => {
    const baseId = `test-base-${crypto.randomUUID()}`;
    const appId = `test-app-${crypto.randomUUID()}`;
    const appV1Activate = vi.fn();
    const appV1Deactivate = vi.fn();
    const appV2Activate = vi.fn();
    const appV2Deactivate = vi.fn();

    await publish(manifest(baseId), {
      packId: baseId,
      version: "1.0.0",
      activate: vi.fn(),
      deactivate: vi.fn(),
    });
    const appV1 = manifest(appId, "1.0.0", {
      dependencies: [
        { packId: baseId, versionRange: "^1.0.0", optional: false },
      ],
      requiredPermissions: ["capability.execute"],
    });
    const appV2 = manifest(appId, "2.0.0", {
      dependencies: [
        { packId: baseId, versionRange: "^1.0.0", optional: false },
      ],
      requiredPermissions: ["capability.execute"],
    });
    await publish(appV1, {
      packId: appId,
      version: "1.0.0",
      activate: appV1Activate,
      deactivate: appV1Deactivate,
    });
    await publish(appV2, {
      packId: appId,
      version: "2.0.0",
      activate: appV2Activate,
      deactivate: appV2Deactivate,
    });

    await expect(
      platform.install("org-a", appId, "1.0.0", context()),
    ).rejects.toThrow(`Dependency "${baseId}@^1.0.0" is not installed.`);
    await platform.install("org-a", baseId, "1.0.0", context());
    await platform.install("org-a", appId, "1.0.0", context());
    await expect(
      platform.activate("org-a", appId, new Set(), context()),
    ).rejects.toThrow("capability.execute");

    const active = await platform.activate(
      "org-a",
      appId,
      new Set(["capability.execute"]),
      context(),
    );
    expect(active.status).toBe("activated");
    expect(appV1Activate).toHaveBeenCalledOnce();

    const upgraded = await platform.upgrade(
      "org-a",
      appId,
      "2.0.0",
      new Set(["capability.execute"]),
      context(),
    );
    expect(upgraded.version).toBe("2.0.0");
    expect(upgraded.previousVersion).toBe("1.0.0");
    expect(appV1Deactivate).toHaveBeenCalledOnce();
    expect(appV2Activate).toHaveBeenCalledOnce();

    const rolledBack = await platform.rollback(
      "org-a",
      appId,
      new Set(["capability.execute"]),
      context(),
    );
    expect(rolledBack.version).toBe("1.0.0");
    expect(appV2Deactivate).toHaveBeenCalledOnce();
    expect(appV1Activate).toHaveBeenCalledTimes(2);

    await expect(platform.remove("org-a", baseId, context())).rejects.toThrow(
      `required by "${appId}"`,
    );
    await platform.remove("org-a", appId, context());
    await platform.remove("org-a", baseId, context());
    expect(await platform.repository.listInstallations("org-a")).toEqual([]);

    const history = await platform.repository.listHistory(appId, "org-a");
    expect(history.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        "installed",
        "activated",
        "updated",
        "rolled_back",
        "removed",
      ]),
    );
    expect(Object.isFrozen(history)).toBe(true);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "capability.pack.installed",
        "capability.pack.activated",
        "capability.pack.updated",
        "capability.pack.deactivated",
        "capability.pack.removed",
      ]),
    );
  });

  it("isolates tenants and compensates a failed active upgrade", async () => {
    const packId = `test-compensation-${crypto.randomUUID()}`;
    const oldActivate = vi.fn();
    const oldDeactivate = vi.fn();
    const failedActivate = vi.fn(() => {
      throw new Error("activation failed");
    });
    await publish(manifest(packId), {
      packId,
      version: "1.0.0",
      activate: oldActivate,
      deactivate: oldDeactivate,
    });
    await publish(manifest(packId, "2.0.0"), {
      packId,
      version: "2.0.0",
      activate: failedActivate,
      deactivate: vi.fn(),
    });
    await platform.install("org-a", packId, "1.0.0", context());
    await platform.activate("org-a", packId, new Set(), context());

    await expect(
      platform.install("org-b", packId, "1.0.0", context("org-a")),
    ).rejects.toThrow("tenant does not match");
    await expect(
      platform.upgrade("org-a", packId, "2.0.0", new Set(), context()),
    ).rejects.toThrow("activation failed");

    expect(oldDeactivate).toHaveBeenCalledOnce();
    expect(oldActivate).toHaveBeenCalledTimes(2);
    expect(
      await platform.repository.getInstallation("org-a", packId),
    ).toMatchObject({ version: "1.0.0", status: "activated" });
    expect(await platform.repository.listInstallations("org-b")).toEqual([]);
  });

  it("rejects invalid manifests and untrusted signatures with audit events", async () => {
    const invalidId = `test-invalid-${crypto.randomUUID()}`;
    const invalid = manifest(invalidId, "1.0.0", {
      registriesUsed: ["unapproved_registry"],
    });
    await platform.registerDraft(invalid, context());
    await platform.build(invalid.id, invalid.version, context());
    const report = await platform.validate(
      invalid.id,
      invalid.version,
      context(),
    );
    expect(report.valid).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid_registry" }),
      ]),
    );

    const unsignedId = `test-unsigned-${crypto.randomUUID()}`;
    const unsigned = manifest(unsignedId);
    await platform.registerDraft(unsigned, context());
    await platform.build(unsigned.id, unsigned.version, context());
    await platform.validate(unsigned.id, unsigned.version, context());
    await expect(
      platform.attachSignature(
        unsigned.id,
        unsigned.version,
        {
          ...signatureFor(unsigned, privateKey),
          value: Buffer.from("tampered").toString("base64"),
        },
        context(),
      ),
    ).rejects.toThrow("invalid or untrusted");

    const failures = events.filter(
      (event) => event.type === "capability.pack.validation.failed",
    );
    expect(failures).toHaveLength(2);
    const signatureHistory = await platform.repository.listHistory(unsignedId);
    expect(signatureHistory.at(-1)?.action).toBe("validation_failed");
  });
});
