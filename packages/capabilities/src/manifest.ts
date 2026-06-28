import { createHash, verify } from "node:crypto";
import type {
  CapabilityManifest,
  CapabilitySignature,
  CapabilityValidationIssue,
  CapabilityValidationReport,
} from "@boss/types";

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const idPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const eventPattern = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

export function canonicalManifest(manifest: CapabilityManifest): string {
  return JSON.stringify(canonical(manifest));
}

export function digestManifest(manifest: CapabilityManifest): string {
  return createHash("sha256")
    .update(canonicalManifest(manifest))
    .digest("hex");
}

export function verifyCapabilitySignature(
  manifest: CapabilityManifest,
  signature: CapabilitySignature,
  publicKey: string,
): boolean {
  const digest = digestManifest(manifest);
  return (
    signature.algorithm === "ed25519" &&
    signature.manifestDigest === digest &&
    verify(
      null,
      Buffer.from(digest, "hex"),
      publicKey,
      Buffer.from(signature.value, "base64"),
    )
  );
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
}

function parseSemver(value: string): Semver | null {
  const match = semverPattern.exec(value);
  return match
    ? {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
      }
    : null;
}

function compare(left: Semver, right: Semver): number {
  return (
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch
  );
}

export function satisfiesVersion(version: string, range: string): boolean {
  const parsed = parseSemver(version);
  if (!parsed) return false;
  const trimmed = range.trim();
  if (trimmed === "*" || trimmed === "") return true;
  if (trimmed.startsWith("^")) {
    const minimum = parseSemver(trimmed.slice(1));
    return Boolean(
      minimum &&
        compare(parsed, minimum) >= 0 &&
        parsed.major === minimum.major,
    );
  }
  const tokens = trimmed.split(/\s+/);
  return tokens.every((token) => {
    const match = /^(>=|<=|>|<|=)?(.+)$/.exec(token);
    if (!match) return false;
    const expected = parseSemver(match[2]!);
    if (!expected) return false;
    const result = compare(parsed, expected);
    switch (match[1] ?? "=") {
      case ">=":
        return result >= 0;
      case "<=":
        return result <= 0;
      case ">":
        return result > 0;
      case "<":
        return result < 0;
      default:
        return result === 0;
    }
  });
}

export function validateCapabilityManifest(
  manifest: CapabilityManifest,
): CapabilityValidationReport {
  const issues: CapabilityValidationIssue[] = [];
  const issue = (
    code: CapabilityValidationIssue["code"],
    message: string,
    path: string,
  ): void => {
    issues.push({ code, severity: "error", message, path });
  };
  if (manifest.schemaVersion !== "1.0.0") {
    issue("invalid_manifest", "Unsupported manifest schema version.", "schemaVersion");
  }
  if (!idPattern.test(manifest.id)) {
    issue("invalid_manifest", "Pack ID must be a stable lowercase identifier.", "id");
  }
  if (!manifest.name.trim() || !manifest.description.trim()) {
    issue("invalid_manifest", "Pack name and description are required.", "name");
  }
  if (!parseSemver(manifest.version)) {
    issue("invalid_version", "Pack version must use semantic versioning.", "version");
  }
  if (!manifest.entrypoint.trim()) {
    issue("invalid_manifest", "Pack entrypoint is required.", "entrypoint");
  }
  if (
    !parseSemver(manifest.compatibility.runtimeApiVersion) ||
    !manifest.compatibility.platformVersionRange.trim()
  ) {
    issue(
      "invalid_version",
      "Compatibility requires a platform range and runtime API version.",
      "compatibility",
    );
  }
  const dependencyIds = manifest.dependencies.map((item) => item.packId);
  if (new Set(dependencyIds).size !== dependencyIds.length) {
    issue(
      "duplicate_dependency",
      "Pack dependencies must be unique.",
      "dependencies",
    );
  }
  if (dependencyIds.includes(manifest.id)) {
    issue(
      "duplicate_dependency",
      "A pack cannot depend on itself.",
      "dependencies",
    );
  }
  for (const [index, dependency] of manifest.dependencies.entries()) {
    if (
      !idPattern.test(dependency.packId) ||
      !dependency.versionRange.trim()
    ) {
      issue(
        "invalid_manifest",
        "Dependency ID and version range are required.",
        `dependencies.${index}`,
      );
    }
  }
  for (const [kind, events] of [
    ["eventsPublished", manifest.eventsPublished],
    ["eventsConsumed", manifest.eventsConsumed],
  ] as const) {
    events.forEach((event, index) => {
      if (!eventPattern.test(event)) {
        issue(
          "invalid_manifest",
          `Event "${event}" is not a canonical dotted event ID.`,
          `${kind}.${index}`,
        );
      }
    });
  }
  for (const [field, values] of [
    ["requiredCapabilities", manifest.requiredCapabilities],
    ["requiredPermissions", manifest.requiredPermissions],
    ["registriesUsed", manifest.registriesUsed],
  ] as const) {
    if (values.some((value) => !value.trim())) {
      issue("invalid_manifest", `${field} cannot contain empty IDs.`, field);
    }
    if (new Set(values).size !== values.length) {
      issue("invalid_manifest", `${field} cannot contain duplicates.`, field);
    }
  }
  const ordered = Object.freeze(
    issues.sort((left, right) =>
      `${left.path}:${left.code}`.localeCompare(`${right.path}:${right.code}`),
    ),
  );
  return Object.freeze({
    packId: manifest.id,
    packVersion: manifest.version,
    valid: ordered.length === 0,
    issues: ordered,
    validatedAt: new Date().toISOString(),
  });
}
