import type { SecretStore, SecretRef, SecretAuditEntry } from "./types.js";

/**
 * Dev/test SecretStore implementation that reads from process.env.
 * secretRef.key is used directly as the environment variable name.
 *
 * NOT suitable for production — env vars are visible in process listings,
 * are not rotated automatically, and provide no tenant isolation beyond
 * what the calling code enforces. This exists to unblock local development
 * and the test suite while Goal 17 (real KMS integration) is pending.
 */
export function createEnvSecretStore(): SecretStore {
  const auditLog = new Map<string, SecretAuditEntry[]>();

  function logEntry(ref: SecretRef, action: SecretAuditEntry["action"], actor: string) {
    const key = `${ref.orgId}:${ref.key}`;
    const entries = auditLog.get(key) ?? [];
    entries.push({ action, occurredAt: new Date().toISOString(), actor });
    auditLog.set(key, entries);
  }

  return {
    async get(ref, actor) {
      const value = process.env[ref.key] ?? null;
      logEntry(ref, "get", actor);
      return value;
    },
    async put(_ref, _value, _meta) {
      throw new Error("EnvSecretStore is read-only — put/rotate/delete require a writable SecretStore implementation");
    },
    async rotate(_ref, _newValue, _actor) {
      throw new Error("EnvSecretStore is read-only — put/rotate/delete require a writable SecretStore implementation");
    },
    async delete(_ref, _actor) {
      throw new Error("EnvSecretStore is read-only — put/rotate/delete require a writable SecretStore implementation");
    },
    async audit(ref) {
      return auditLog.get(`${ref.orgId}:${ref.key}`) ?? [];
    },
    async listVersions(_ref) {
      return [];
    },
  };
}
