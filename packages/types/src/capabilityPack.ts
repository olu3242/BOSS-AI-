import type { ID } from "./primitives.js";

export type CapabilityPackType =
  | "diagnostic"
  | "strategy"
  | "planning"
  | "workflow"
  | "automation"
  | "policy"
  | "ai_prompt"
  | "industry"
  | "connector"
  | "dashboard";

export type CapabilityReleaseStatus =
  | "draft"
  | "built"
  | "validated"
  | "signed"
  | "published"
  | "deprecated"
  | "archived";

export type CapabilityInstallationStatus = "installed" | "activated";

export interface CapabilityVersion {
  readonly value: string;
  readonly releasedAt?: string;
}

export interface CapabilityDependency {
  readonly packId: ID;
  readonly versionRange: string;
  readonly optional: boolean;
}

export interface CapabilityCompatibility {
  readonly platformVersionRange: string;
  readonly runtimeApiVersion: string;
}

export interface CapabilitySignature {
  readonly algorithm: "ed25519";
  readonly keyId: string;
  readonly manifestDigest: string;
  readonly value: string;
  readonly signedAt: string;
}

export interface CapabilityManifest {
  readonly schemaVersion: "1.0.0";
  readonly id: ID;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly type: CapabilityPackType;
  readonly dependencies: readonly CapabilityDependency[];
  readonly compatibility: CapabilityCompatibility;
  readonly requiredCapabilities: readonly string[];
  readonly requiredPermissions: readonly string[];
  readonly eventsPublished: readonly string[];
  readonly eventsConsumed: readonly string[];
  readonly registriesUsed: readonly string[];
  readonly entrypoint: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface CapabilityPack {
  readonly id: ID;
  readonly manifest: CapabilityManifest;
  readonly status: CapabilityReleaseStatus;
  readonly signature: CapabilitySignature | null;
  readonly manifestDigest: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CapabilityPackInstallation {
  readonly id: ID;
  readonly orgId: ID;
  readonly packId: ID;
  readonly version: string;
  readonly previousVersion: string | null;
  readonly status: CapabilityInstallationStatus;
  readonly installedAt: string;
  readonly activatedAt: string | null;
  readonly updatedAt: string;
}

export interface CapabilityPackHistoryEntry {
  readonly id: ID;
  readonly orgId: ID | null;
  readonly packId: ID;
  readonly packVersion: string;
  readonly action:
    | CapabilityReleaseStatus
    | "installed"
    | "activated"
    | "updated"
    | "deactivated"
    | "removed"
    | "rolled_back"
    | "validation_failed";
  readonly actorId: ID;
  readonly correlationId: string;
  readonly traceId: string;
  readonly reason: string;
  readonly occurredAt: string;
}

export interface CapabilityValidationIssue {
  readonly code:
    | "invalid_manifest"
    | "invalid_version"
    | "duplicate_dependency"
    | "missing_dependency"
    | "incompatible_platform"
    | "incompatible_runtime"
    | "invalid_signature"
    | "missing_permission"
    | "invalid_registry";
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly path: string;
}

export interface CapabilityValidationReport {
  readonly packId: ID;
  readonly packVersion: string;
  readonly valid: boolean;
  readonly issues: readonly CapabilityValidationIssue[];
  readonly validatedAt: string;
}
