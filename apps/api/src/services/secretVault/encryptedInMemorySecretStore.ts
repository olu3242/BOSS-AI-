import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { SecretStore, SecretRef, SecretMeta, SecretAuditEntry, SecretVersion } from "./types.js";

interface EncryptedEntry {
  iv: string;
  ciphertext: string;
  meta: SecretMeta;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * In-process SecretStore with AES-256-GCM encryption at rest.
 *
 * Keys are scoped by orgId (tenant isolation). Supports put/get/rotate/delete
 * and a full audit trail. NOT durable across restarts. NOT suitable for
 * multi-process/distributed deployments. Intended for dev/test environments
 * and to demonstrate the SecretStore contract until a real KMS driver is built.
 *
 * KEY: read from SECRET_VAULT_KEY env var (must be 32 hex bytes = 64 chars).
 * Falls back to a deterministic test key when NODE_ENV !== "production".
 */
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const ALGORITHM = "aes-256-gcm";

function deriveKey(): Buffer {
  const raw = process.env["SECRET_VAULT_KEY"] ?? (process.env["NODE_ENV"] !== "production" ? TEST_KEY : null);
  if (!raw) throw new Error("SECRET_VAULT_KEY must be set in production");
  return Buffer.from(raw, "hex");
}

function encrypt(plaintext: string, key: Buffer): { iv: string; ciphertext: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv) as ReturnType<typeof createCipheriv> & { getAuthTag(): Buffer };
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  const authTag = (cipher as { getAuthTag(): Buffer }).getAuthTag().toString("hex");
  return { iv: iv.toString("hex"), ciphertext: enc + ":" + authTag };
}

function decrypt(iv: string, ciphertext: string, key: Buffer): string {
  const [enc, authTag] = ciphertext.split(":");
  if (!enc || !authTag) throw new Error("Invalid ciphertext format");
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex")) as ReturnType<typeof createDecipheriv> & { setAuthTag(t: Buffer): void };
  (decipher as { setAuthTag(t: Buffer): void }).setAuthTag(Buffer.from(authTag, "hex"));
  let plain = decipher.update(enc, "hex", "utf8");
  plain += decipher.final("utf8");
  return plain;
}

export function createEncryptedInMemorySecretStore(): SecretStore {
  const store = new Map<string, EncryptedEntry>();
  const auditLog = new Map<string, SecretAuditEntry[]>();
  const versionHistory = new Map<string, SecretVersion[]>();

  function storeKey(ref: SecretRef): string {
    return `${ref.orgId}:${ref.key}`;
  }

  function logEntry(ref: SecretRef, action: SecretAuditEntry["action"], actor: string) {
    const key = storeKey(ref);
    const entries = auditLog.get(key) ?? [];
    entries.push({ action, occurredAt: new Date().toISOString(), actor });
    auditLog.set(key, entries);
  }

  return {
    async get(ref, actor) {
      const entry = store.get(storeKey(ref));
      logEntry(ref, "get", actor);
      if (!entry) return null;
      try {
        return decrypt(entry.iv, entry.ciphertext, deriveKey());
      } catch {
        return null;
      }
    },
    async put(ref, value, meta) {
      const key = deriveKey();
      const { iv, ciphertext } = encrypt(value, key);
      const now = new Date().toISOString();
      const existing = store.get(storeKey(ref));
      const version = (existing?.version ?? 0) + 1;
      store.set(storeKey(ref), { iv, ciphertext, meta, createdAt: existing?.createdAt ?? now, updatedAt: now, version });
      logEntry(ref, "put", "system");
    },
    async rotate(ref, newValue, actor) {
      const existing = store.get(storeKey(ref));
      if (!existing) throw new Error(`Secret ${ref.key} not found for org ${ref.orgId}`);
      const key = deriveKey();
      const { iv, ciphertext } = encrypt(newValue, key);
      const now = new Date().toISOString();
      const newVersion = existing.version + 1;
      store.set(storeKey(ref), {
        iv,
        ciphertext,
        meta: { ...existing.meta, rotatedAt: now },
        createdAt: existing.createdAt,
        updatedAt: now,
        version: newVersion,
      });
      const sKey = storeKey(ref);
      const history = versionHistory.get(sKey) ?? [];
      history.unshift({ version: newVersion, rotatedAt: now, actor });
      versionHistory.set(sKey, history);
      logEntry(ref, "rotate", actor);
    },
    async delete(ref, actor) {
      store.delete(storeKey(ref));
      logEntry(ref, "delete", actor);
    },
    async audit(ref) {
      return auditLog.get(storeKey(ref)) ?? [];
    },
    async listVersions(ref) {
      return versionHistory.get(storeKey(ref)) ?? [];
    },
  };
}
