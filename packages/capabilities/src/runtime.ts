import { randomUUID } from "node:crypto";
import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import {
  capabilityPackRegistry,
  marketplaceRegistry,
} from "@boss/registries";
import type {
  CapabilityManifest,
  CapabilityPack,
  CapabilityPackHistoryEntry,
  CapabilityPackInstallation,
  CapabilityReleaseStatus,
  CapabilitySignature,
  CapabilityValidationIssue,
  CapabilityValidationReport,
} from "@boss/types";
import {
  digestManifest,
  satisfiesVersion,
  validateCapabilityManifest,
  verifyCapabilitySignature,
} from "./manifest.js";

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value as Record<string, unknown>)) {
      freeze(item);
    }
  }
  return value;
}

function releaseKey(packId: string, version: string): string {
  return `${packId}@${version}`;
}

function installationKey(orgId: string, packId: string): string {
  return `${orgId}:${packId}`;
}

export interface CapabilityPackModule {
  readonly packId: string;
  readonly version: string;
  activate(context: EventContext): void | Promise<void>;
  deactivate(context: EventContext): void | Promise<void>;
}

export interface CapabilityTrustStore {
  getPublicKey(keyId: string): string | undefined;
}

export class InMemoryCapabilityTrustStore implements CapabilityTrustStore {
  private readonly keys = new Map<string, string>();

  trust(keyId: string, publicKey: string): void {
    this.keys.set(keyId, publicKey);
  }

  getPublicKey(keyId: string): string | undefined {
    return this.keys.get(keyId);
  }
}

export class PackLoader {
  private readonly modules = new Map<string, CapabilityPackModule>();

  register(module: CapabilityPackModule): void {
    const key = releaseKey(module.packId, module.version);
    if (this.modules.has(key)) {
      throw new Error(`Capability module "${key}" is already registered.`);
    }
    this.modules.set(key, freeze(module));
  }

  load(packId: string, version: string): CapabilityPackModule {
    const module = this.modules.get(releaseKey(packId, version));
    if (!module) {
      throw new Error(
        `Capability module "${packId}@${version}" is not loadable.`,
      );
    }
    return module;
  }
}

export interface CapabilityPackRepository {
  createRelease(manifest: CapabilityManifest): Promise<CapabilityPack>;
  updateRelease(release: CapabilityPack): Promise<CapabilityPack>;
  getRelease(packId: string, version: string): Promise<CapabilityPack | null>;
  listReleases(packId?: string): Promise<readonly CapabilityPack[]>;
  saveInstallation(
    installation: CapabilityPackInstallation,
  ): Promise<CapabilityPackInstallation>;
  getInstallation(
    orgId: string,
    packId: string,
  ): Promise<CapabilityPackInstallation | null>;
  listInstallations(
    orgId: string,
  ): Promise<readonly CapabilityPackInstallation[]>;
  removeInstallation(orgId: string, packId: string): Promise<void>;
  appendHistory(
    entry: Omit<CapabilityPackHistoryEntry, "id" | "occurredAt">,
  ): Promise<CapabilityPackHistoryEntry>;
  listHistory(
    packId: string,
    orgId?: string,
  ): Promise<readonly CapabilityPackHistoryEntry[]>;
}

export class InMemoryCapabilityPackRepository
  implements CapabilityPackRepository
{
  private readonly releases = new Map<string, CapabilityPack>();
  private readonly installations = new Map<
    string,
    CapabilityPackInstallation
  >();
  private readonly history: CapabilityPackHistoryEntry[] = [];

  async createRelease(manifest: CapabilityManifest): Promise<CapabilityPack> {
    const key = releaseKey(manifest.id, manifest.version);
    if (this.releases.has(key)) {
      throw new Error(`Capability release "${key}" already exists.`);
    }
    const now = new Date().toISOString();
    const release = freeze({
      id: randomUUID(),
      manifest: structuredClone(manifest),
      status: "draft" as const,
      signature: null,
      manifestDigest: digestManifest(manifest),
      createdAt: now,
      updatedAt: now,
    });
    this.releases.set(key, release);
    return release;
  }

  async updateRelease(release: CapabilityPack): Promise<CapabilityPack> {
    const stored = freeze(structuredClone(release));
    this.releases.set(
      releaseKey(release.manifest.id, release.manifest.version),
      stored,
    );
    return stored;
  }

  async getRelease(
    packId: string,
    version: string,
  ): Promise<CapabilityPack | null> {
    return this.releases.get(releaseKey(packId, version)) ?? null;
  }

  async listReleases(packId?: string): Promise<readonly CapabilityPack[]> {
    return Object.freeze(
      [...this.releases.values()]
        .filter((release) => !packId || release.manifest.id === packId)
        .sort((left, right) =>
          releaseKey(left.manifest.id, left.manifest.version).localeCompare(
            releaseKey(right.manifest.id, right.manifest.version),
          ),
        ),
    );
  }

  async saveInstallation(
    installation: CapabilityPackInstallation,
  ): Promise<CapabilityPackInstallation> {
    const stored = freeze(structuredClone(installation));
    this.installations.set(
      installationKey(installation.orgId, installation.packId),
      stored,
    );
    return stored;
  }

  async getInstallation(
    orgId: string,
    packId: string,
  ): Promise<CapabilityPackInstallation | null> {
    return this.installations.get(installationKey(orgId, packId)) ?? null;
  }

  async listInstallations(
    orgId: string,
  ): Promise<readonly CapabilityPackInstallation[]> {
    return Object.freeze(
      [...this.installations.values()]
        .filter((installation) => installation.orgId === orgId)
        .sort((left, right) => left.packId.localeCompare(right.packId)),
    );
  }

  async removeInstallation(orgId: string, packId: string): Promise<void> {
    this.installations.delete(installationKey(orgId, packId));
  }

  async appendHistory(
    entry: Omit<CapabilityPackHistoryEntry, "id" | "occurredAt">,
  ): Promise<CapabilityPackHistoryEntry> {
    const stored = freeze({
      id: randomUUID(),
      occurredAt: new Date().toISOString(),
      ...entry,
    });
    this.history.push(stored);
    return stored;
  }

  async listHistory(
    packId: string,
    orgId?: string,
  ): Promise<readonly CapabilityPackHistoryEntry[]> {
    return Object.freeze(
      this.history.filter(
        (entry) =>
          entry.packId === packId &&
          (orgId === undefined || entry.orgId === orgId),
      ),
    );
  }
}

export class CompatibilityValidator {
  constructor(
    private readonly platformVersion: string,
    private readonly runtimeApiVersion: string,
    private readonly allowedRegistries: ReadonlySet<string>,
  ) {}

  validate(manifest: CapabilityManifest): readonly CapabilityValidationIssue[] {
    const issues: CapabilityValidationIssue[] = [];
    if (
      !satisfiesVersion(
        this.platformVersion,
        manifest.compatibility.platformVersionRange,
      )
    ) {
      issues.push({
        code: "incompatible_platform",
        severity: "error",
        message: `Platform ${this.platformVersion} does not satisfy ${manifest.compatibility.platformVersionRange}.`,
        path: "compatibility.platformVersionRange",
      });
    }
    if (
      this.runtimeApiVersion !==
      manifest.compatibility.runtimeApiVersion
    ) {
      issues.push({
        code: "incompatible_runtime",
        severity: "error",
        message: `Runtime API ${manifest.compatibility.runtimeApiVersion} is not supported.`,
        path: "compatibility.runtimeApiVersion",
      });
    }
    manifest.registriesUsed.forEach((registryId, index) => {
      if (!this.allowedRegistries.has(registryId)) {
        issues.push({
          code: "invalid_registry",
          severity: "error",
          message: `Registry "${registryId}" is not approved for packs.`,
          path: `registriesUsed.${index}`,
        });
      }
    });
    return Object.freeze(issues);
  }
}

export class PackResolver {
  constructor(private readonly repository: CapabilityPackRepository) {}

  async validateDependencies(
    orgId: string,
    manifest: CapabilityManifest,
  ): Promise<readonly CapabilityValidationIssue[]> {
    const installed = await this.repository.listInstallations(orgId);
    const issues: CapabilityValidationIssue[] = [];
    for (const [index, dependency] of manifest.dependencies.entries()) {
      const match = installed.find(
        (item) =>
          item.packId === dependency.packId &&
          satisfiesVersion(item.version, dependency.versionRange),
      );
      if (!match && !dependency.optional) {
        issues.push({
          code: "missing_dependency",
          severity: "error",
          message: `Dependency "${dependency.packId}@${dependency.versionRange}" is not installed.`,
          path: `dependencies.${index}`,
        });
      }
    }
    return Object.freeze(issues);
  }

  async assertNoDependents(orgId: string, packId: string): Promise<void> {
    for (const installation of await this.repository.listInstallations(orgId)) {
      if (installation.packId === packId) continue;
      const release = await this.repository.getRelease(
        installation.packId,
        installation.version,
      );
      if (
        release?.manifest.dependencies.some(
          (dependency) =>
            dependency.packId === packId && !dependency.optional,
        )
      ) {
        throw new Error(
          `Capability pack "${packId}" is required by "${installation.packId}".`,
        );
      }
    }
  }
}

export class ActivationService {
  constructor(private readonly loader: PackLoader) {}

  async activate(
    release: CapabilityPack,
    context: EventContext,
  ): Promise<void> {
    await this.loader
      .load(release.manifest.id, release.manifest.version)
      .activate(context);
  }

  async deactivate(
    release: CapabilityPack,
    context: EventContext,
  ): Promise<void> {
    await this.loader
      .load(release.manifest.id, release.manifest.version)
      .deactivate(context);
  }
}

export interface CapabilityPackPlatformOptions {
  readonly platformVersion: string;
  readonly runtimeApiVersion: string;
  readonly allowedRegistries: ReadonlySet<string>;
  readonly trustStore: CapabilityTrustStore;
  readonly repository?: CapabilityPackRepository;
  readonly loader?: PackLoader;
  readonly eventBus?: EventBus;
}

const releaseTransitions: Readonly<
  Record<CapabilityReleaseStatus, readonly CapabilityReleaseStatus[]>
> = Object.freeze({
  draft: Object.freeze<CapabilityReleaseStatus[]>(["built"]),
  built: Object.freeze<CapabilityReleaseStatus[]>(["validated"]),
  validated: Object.freeze<CapabilityReleaseStatus[]>(["signed"]),
  signed: Object.freeze<CapabilityReleaseStatus[]>(["published"]),
  published: Object.freeze<CapabilityReleaseStatus[]>(["deprecated"]),
  deprecated: Object.freeze<CapabilityReleaseStatus[]>(["archived"]),
  archived: Object.freeze<CapabilityReleaseStatus[]>([]),
});

export class CapabilityPackPlatform {
  readonly repository: CapabilityPackRepository;
  readonly loader: PackLoader;
  private readonly events: EventBus;
  private readonly compatibility: CompatibilityValidator;
  private readonly resolver: PackResolver;
  private readonly activation: ActivationService;

  constructor(private readonly options: CapabilityPackPlatformOptions) {
    this.repository =
      options.repository ?? new InMemoryCapabilityPackRepository();
    this.loader = options.loader ?? new PackLoader();
    this.events = options.eventBus ?? new InMemoryEventBus();
    this.compatibility = new CompatibilityValidator(
      options.platformVersion,
      options.runtimeApiVersion,
      options.allowedRegistries,
    );
    this.resolver = new PackResolver(this.repository);
    this.activation = new ActivationService(this.loader);
  }

  async registerDraft(
    manifest: CapabilityManifest,
    context: EventContext,
  ): Promise<CapabilityPack> {
    const release = await this.repository.createRelease(manifest);
    await this.history(release, "draft", context, "Draft registered.");
    return release;
  }

  build(
    packId: string,
    version: string,
    context: EventContext,
  ): Promise<CapabilityPack> {
    return this.transition(
      packId,
      version,
      "built",
      context,
      "Pack build completed.",
    );
  }

  async validate(
    packId: string,
    version: string,
    context: EventContext,
  ): Promise<CapabilityValidationReport> {
    const release = await this.requireRelease(packId, version);
    if (release.status !== "built") {
      throw new Error("Only built capability packs can be validated.");
    }
    const manifestReport = validateCapabilityManifest(release.manifest);
    const issues = Object.freeze([
      ...manifestReport.issues,
      ...this.compatibility.validate(release.manifest),
    ]);
    const report = Object.freeze({
      packId,
      packVersion: version,
      valid: !issues.some((issue) => issue.severity === "error"),
      issues,
      validatedAt: new Date().toISOString(),
    });
    if (!report.valid) {
      await this.history(
        release,
        "validation_failed",
        context,
        issues.map((issue) => issue.message).join("; "),
      );
      await this.emit(
        "capability.pack.validation.failed",
        release,
        context,
        { issues },
      );
      return report;
    }
    await this.transition(
      packId,
      version,
      "validated",
      context,
      "Manifest and compatibility validation passed.",
    );
    return report;
  }

  async attachSignature(
    packId: string,
    version: string,
    signature: CapabilitySignature,
    context: EventContext,
  ): Promise<CapabilityPack> {
    const release = await this.requireRelease(packId, version);
    if (release.status !== "validated") {
      throw new Error("Only validated capability packs can be signed.");
    }
    const publicKey = this.options.trustStore.getPublicKey(signature.keyId);
    if (
      !publicKey ||
      !verifyCapabilitySignature(release.manifest, signature, publicKey)
    ) {
      await this.history(
        release,
        "validation_failed",
        context,
        "Capability pack signature is invalid or untrusted.",
      );
      await this.emit("capability.pack.validation.failed", release, context, {
        issues: ["Capability pack signature is invalid or untrusted."],
      });
      throw new Error("Capability pack signature is invalid or untrusted.");
    }
    const signed = freeze({
      ...release,
      signature,
      status: "signed" as const,
      updatedAt: new Date().toISOString(),
    });
    await this.repository.updateRelease(signed);
    await this.history(signed, "signed", context, "Trusted signature attached.");
    return signed;
  }

  async publish(
    packId: string,
    version: string,
    context: EventContext,
  ): Promise<CapabilityPack> {
    const release = await this.transition(
      packId,
      version,
      "published",
      context,
      "Signed pack published.",
    );
    if (!release.signature) {
      throw new Error("Published capability packs require a signature.");
    }
    const key = releaseKey(packId, version);
    capabilityPackRegistry.register({
      id: key,
      displayName: release.manifest.name,
      key,
      label: release.manifest.name,
      packId,
      packVersion: version,
      type: release.manifest.type,
      manifest: release.manifest,
      manifestDigest: release.manifestDigest,
      signature: release.signature,
      owner: release.signature.keyId,
      version,
      status: "published",
      documentation: release.manifest.entrypoint,
    });
    marketplaceRegistry.register({
      id: key,
      displayName: release.manifest.name,
      key,
      label: release.manifest.name,
      packId,
      packVersion: version,
      type: release.manifest.type,
      description: release.manifest.description,
      owner: release.signature.keyId,
      version,
      status: "published",
      documentation: release.manifest.entrypoint,
    });
    return release;
  }

  async install(
    orgId: string,
    packId: string,
    version: string,
    context: EventContext,
  ): Promise<CapabilityPackInstallation> {
    this.assertTenant(orgId, context);
    if (await this.repository.getInstallation(orgId, packId)) {
      throw new Error(`Capability pack "${packId}" is already installed.`);
    }
    const release = await this.requirePublished(packId, version);
    await this.assertInstallable(orgId, release);
    this.loader.load(packId, version);
    const now = new Date().toISOString();
    const installation = await this.repository.saveInstallation(
      freeze({
        id: randomUUID(),
        orgId,
        packId,
        version,
        previousVersion: null,
        status: "installed" as const,
        installedAt: now,
        activatedAt: null,
        updatedAt: now,
      }),
    );
    await this.history(release, "installed", context, "Pack installed.", orgId);
    await this.emit("capability.pack.installed", release, context, {
      installationId: installation.id,
    });
    return installation;
  }

  async activate(
    orgId: string,
    packId: string,
    grantedPermissions: ReadonlySet<string>,
    context: EventContext,
  ): Promise<CapabilityPackInstallation> {
    this.assertTenant(orgId, context);
    const installation = await this.requireInstallation(orgId, packId);
    const release = await this.requirePublished(
      packId,
      installation.version,
    );
    const missing = release.manifest.requiredPermissions.filter(
      (permission) => !grantedPermissions.has(permission),
    );
    if (missing.length > 0) {
      throw new Error(
        `Capability pack requires permissions: ${missing.join(", ")}.`,
      );
    }
    await this.activation.activate(release, context);
    const activated = await this.repository.saveInstallation(
      freeze({
        ...installation,
        status: "activated" as const,
        activatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    await this.history(release, "activated", context, "Pack activated.", orgId);
    await this.emit("capability.pack.activated", release, context, {
      installationId: installation.id,
    });
    return activated;
  }

  async deactivate(
    orgId: string,
    packId: string,
    context: EventContext,
  ): Promise<CapabilityPackInstallation> {
    this.assertTenant(orgId, context);
    const installation = await this.requireInstallation(orgId, packId);
    if (installation.status !== "activated") return installation;
    const release = await this.requirePublished(
      packId,
      installation.version,
    );
    await this.activation.deactivate(release, context);
    const deactivated = await this.repository.saveInstallation(
      freeze({
        ...installation,
        status: "installed" as const,
        activatedAt: null,
        updatedAt: new Date().toISOString(),
      }),
    );
    await this.history(
      release,
      "deactivated",
      context,
      "Pack deactivated.",
      orgId,
    );
    await this.emit("capability.pack.deactivated", release, context, {
      installationId: installation.id,
    });
    return deactivated;
  }

  async upgrade(
    orgId: string,
    packId: string,
    targetVersion: string,
    grantedPermissions: ReadonlySet<string>,
    context: EventContext,
  ): Promise<CapabilityPackInstallation> {
    this.assertTenant(orgId, context);
    const installation = await this.requireInstallation(orgId, packId);
    const target = await this.requirePublished(packId, targetVersion);
    await this.assertInstallable(orgId, target);
    const missing = target.manifest.requiredPermissions.filter(
      (permission) => !grantedPermissions.has(permission),
    );
    if (missing.length > 0) {
      throw new Error(
        `Capability pack requires permissions: ${missing.join(", ")}.`,
      );
    }
    const wasActive = installation.status === "activated";
    const previous = await this.requirePublished(
      packId,
      installation.version,
    );
    if (wasActive) {
      await this.activation.deactivate(previous, context);
    }
    this.loader.load(packId, targetVersion);
    if (wasActive) {
      try {
        await this.activation.activate(target, context);
      } catch (error) {
        await this.activation.activate(previous, context);
        throw error;
      }
    }
    const updated = await this.repository.saveInstallation(
      freeze({
        ...installation,
        version: targetVersion,
        previousVersion: installation.version,
        status: wasActive ? ("activated" as const) : ("installed" as const),
        activatedAt: wasActive ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      }),
    );
    await this.history(target, "updated", context, "Pack upgraded.", orgId);
    await this.emit("capability.pack.updated", target, context, {
      installationId: installation.id,
      previousVersion: installation.version,
    });
    return updated;
  }

  async rollback(
    orgId: string,
    packId: string,
    grantedPermissions: ReadonlySet<string>,
    context: EventContext,
  ): Promise<CapabilityPackInstallation> {
    const installation = await this.requireInstallation(orgId, packId);
    if (!installation.previousVersion) {
      throw new Error("Capability pack has no rollback version.");
    }
    const rollbackVersion = installation.previousVersion;
    const currentVersion = installation.version;
    const rolledBack = await this.upgrade(
      orgId,
      packId,
      rollbackVersion,
      grantedPermissions,
      context,
    );
    const target = await this.requirePublished(packId, rollbackVersion);
    await this.history(
      target,
      "rolled_back",
      context,
      `Rolled back from ${currentVersion}.`,
      orgId,
    );
    return rolledBack;
  }

  async remove(
    orgId: string,
    packId: string,
    context: EventContext,
  ): Promise<void> {
    this.assertTenant(orgId, context);
    await this.resolver.assertNoDependents(orgId, packId);
    let installation = await this.requireInstallation(orgId, packId);
    if (installation.status === "activated") {
      installation = await this.deactivate(orgId, packId, context);
    }
    const release = await this.requirePublished(packId, installation.version);
    await this.repository.removeInstallation(orgId, packId);
    await this.history(release, "removed", context, "Pack removed.", orgId);
    await this.emit("capability.pack.removed", release, context, {
      installationId: installation.id,
    });
  }

  deprecate(
    packId: string,
    version: string,
    context: EventContext,
  ): Promise<CapabilityPack> {
    return this.transition(
      packId,
      version,
      "deprecated",
      context,
      "Pack deprecated.",
    );
  }

  archive(
    packId: string,
    version: string,
    context: EventContext,
  ): Promise<CapabilityPack> {
    return this.transition(
      packId,
      version,
      "archived",
      context,
      "Pack archived.",
    );
  }

  private async assertInstallable(
    orgId: string,
    release: CapabilityPack,
  ): Promise<void> {
    const issues = [
      ...this.compatibility.validate(release.manifest),
      ...(await this.resolver.validateDependencies(orgId, release.manifest)),
    ];
    if (issues.length > 0) {
      throw new Error(issues.map((issue) => issue.message).join("; "));
    }
  }

  private async requireRelease(
    packId: string,
    version: string,
  ): Promise<CapabilityPack> {
    const release = await this.repository.getRelease(packId, version);
    if (!release) {
      throw new Error(`Capability release "${packId}@${version}" was not found.`);
    }
    return release;
  }

  private async requirePublished(
    packId: string,
    version: string,
  ): Promise<CapabilityPack> {
    const release = await this.requireRelease(packId, version);
    if (release.status !== "published") {
      throw new Error(`Capability release "${packId}@${version}" is not published.`);
    }
    if (!release.signature) {
      throw new Error("Published capability release is unsigned.");
    }
    return release;
  }

  private async requireInstallation(
    orgId: string,
    packId: string,
  ): Promise<CapabilityPackInstallation> {
    const installation = await this.repository.getInstallation(orgId, packId);
    if (!installation) {
      throw new Error(`Capability pack "${packId}" is not installed.`);
    }
    return installation;
  }

  private async transition(
    packId: string,
    version: string,
    target: CapabilityReleaseStatus,
    context: EventContext,
    reason: string,
  ): Promise<CapabilityPack> {
    const release = await this.requireRelease(packId, version);
    if (!releaseTransitions[release.status].includes(target)) {
      throw new Error(
        `Capability release cannot transition from ${release.status} to ${target}.`,
      );
    }
    const updated = freeze({
      ...release,
      status: target,
      updatedAt: new Date().toISOString(),
    });
    await this.repository.updateRelease(updated);
    await this.history(updated, target, context, reason);
    return updated;
  }

  private assertTenant(orgId: string, context: EventContext): void {
    if (context.orgId !== orgId) {
      throw new Error("Capability operation tenant does not match context.");
    }
  }

  private history(
    release: CapabilityPack,
    action: CapabilityPackHistoryEntry["action"],
    context: EventContext,
    reason: string,
    orgId: string | null = null,
  ): Promise<CapabilityPackHistoryEntry> {
    return this.repository.appendHistory({
      orgId,
      packId: release.manifest.id,
      packVersion: release.manifest.version,
      action,
      actorId: context.actorId,
      correlationId: context.correlationId,
      traceId: context.traceId,
      reason,
    });
  }

  private emit(
    type: string,
    release: CapabilityPack,
    context: EventContext,
    extra: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    return this.events.publish(
      createBossEvent(
        type,
        {
          tenantId: context.orgId,
          packId: release.manifest.id,
          packVersion: release.manifest.version,
          correlationId: context.correlationId,
          traceId: context.traceId,
          timestamp: new Date().toISOString(),
          ...extra,
        },
        context,
      ),
    );
  }
}
