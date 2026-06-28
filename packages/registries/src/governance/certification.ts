import type { GraphRegistryId } from "../architecture/executionArchitecture.js";

export interface OwnershipEntry {
  readonly registry: string;
  readonly id: string;
  readonly owner: string;
}

export interface CertificationCheck {
  readonly id: string;
  readonly passed: boolean;
  readonly evidence: string;
}

export interface ReadinessScore {
  readonly area: string;
  readonly score: number;
  readonly evidence: readonly string[];
}

export interface IndustryPackCertification {
  readonly id: string;
  readonly version: string;
  readonly compatible: boolean;
  readonly findings: readonly string[];
}

export interface RegistryCertificationSnapshot {
  readonly decision: "GO" | "CONDITIONAL_GO" | "NO_GO";
  readonly checks: readonly CertificationCheck[];
  readonly scores: readonly ReadinessScore[];
  readonly industryPacks: readonly IndustryPackCertification[];
}

let ownershipEntries: readonly OwnershipEntry[] = Object.freeze([]);
let certification: RegistryCertificationSnapshot = Object.freeze({
  decision: "NO_GO",
  checks: Object.freeze([]),
  scores: Object.freeze([]),
  industryPacks: Object.freeze([]),
});

export const ownershipMatrix = {
  list: (): readonly OwnershipEntry[] => ownershipEntries,
  get: (registry: string, id: string): OwnershipEntry | undefined =>
    ownershipEntries.find((entry) => entry.registry === registry && entry.id === id),
} as const;

export const auditMetadata = Object.freeze({
  schemaVersion: "1.0.0",
  changeControl: "pull_request",
  requiredEvidence: Object.freeze([
    "typecheck",
    "lint",
    "affected_tests",
    "build",
  ]),
  immutableIdentityFields: Object.freeze(["id", "version"]),
  traceabilityFields: Object.freeze([
    "owner",
    "documentation",
    "lifecycle",
    "policyIds",
  ]),
});

export const registryCertification = {
  snapshot: (): RegistryCertificationSnapshot => certification,
} as const;

export function registerGovernanceCertification(
  ownership: readonly OwnershipEntry[],
  snapshot: RegistryCertificationSnapshot,
): void {
  ownershipEntries = Object.freeze([...ownership]);
  certification = Object.freeze({
    ...snapshot,
    checks: Object.freeze([...snapshot.checks]),
    scores: Object.freeze([...snapshot.scores]),
    industryPacks: Object.freeze([...snapshot.industryPacks]),
  });
}

export const governedGraphRegistries: readonly GraphRegistryId[] = Object.freeze([
  "agent",
  "capability",
  "workflow",
  "event",
  "trigger",
  "automation",
  "orchestrator",
]);
