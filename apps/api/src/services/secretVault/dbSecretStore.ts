/**
 * DbSecretStore — production AES-256-GCM secret store backed by Postgres.
 * Implements the same SecretStore interface as encryptedInMemorySecretStore.
 * Uses the `provider_credentials` table (migration 0032).
 *
 * The encryption key is read from BOSS_SECRET_VAULT_KEY (32-byte hex).
 * Suitable for multi-process deployments and production use.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { query } from "@boss/db";
import type { SecretStore, SecretRef, SecretAuditEntry, SecretVersion } from "./types.js";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "BOSS_SECRET_VAULT_KEY";

function getEncryptionKey(): Buffer {
  const hex = process.env[KEY_ENV];
  if (!hex || hex.length !== 64) {
    throw new Error(`${KEY_ENV} must be set to a 64-character hex string (32 bytes)`);
  }
  return Buffer.from(hex, "hex");
}

function encrypt(plaintext: string): { iv: string; ciphertext: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("hex"),
    ciphertext: encrypted.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

function decrypt(ciphertext: string, iv: string, authTag: string): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

interface CredentialRow {
  ciphertext: string;
  iv: string;
  auth_tag: string;
}

interface AuditRow {
  action: string;
  actor: string;
  occurred_at: string;
}

export function createDbSecretStore(): SecretStore {
  return {
    async get(ref: SecretRef, actor: string) {
      const rows = await query<CredentialRow>(
        `SELECT ciphertext, iv, auth_tag FROM provider_credentials
         WHERE org_id = $1 AND secret_key = $2 AND deleted_at IS NULL LIMIT 1`,
        [ref.orgId, ref.key]
      );

      if (!rows[0]) return null;

      await query(
        `INSERT INTO provider_credential_audit (org_id, secret_key, action, actor, occurred_at)
         VALUES ($1, $2, 'get', $3, now())`,
        [ref.orgId, ref.key, actor]
      );

      return decrypt(rows[0].ciphertext, rows[0].iv, rows[0].auth_tag);
    },

    async put(ref: SecretRef, value: string) {
      const { iv, ciphertext, authTag } = encrypt(value);
      const now = new Date().toISOString();

      await query(
        `INSERT INTO provider_credentials
           (org_id, secret_key, ciphertext, iv, auth_tag, rotated_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         ON CONFLICT (org_id, secret_key) DO UPDATE SET
           ciphertext = EXCLUDED.ciphertext,
           iv = EXCLUDED.iv,
           auth_tag = EXCLUDED.auth_tag,
           rotated_at = EXCLUDED.rotated_at,
           updated_at = EXCLUDED.updated_at,
           deleted_at = NULL`,
        [ref.orgId, ref.key, ciphertext, iv, authTag, now]
      );

      await query(
        `INSERT INTO provider_credential_audit (org_id, secret_key, action, actor, occurred_at)
         VALUES ($1, $2, 'put', 'system', $3)`,
        [ref.orgId, ref.key, now]
      );
    },

    async rotate(ref: SecretRef, newValue: string, actor: string) {
      await this.put(ref, newValue, { providerKey: ref.key });
      await query(
        `INSERT INTO provider_credential_audit (org_id, secret_key, action, actor, occurred_at)
         VALUES ($1, $2, 'rotate', $3, now())`,
        [ref.orgId, ref.key, actor]
      );
    },

    async delete(ref: SecretRef, actor: string) {
      const now = new Date().toISOString();
      await query(
        `UPDATE provider_credentials SET deleted_at = $3, updated_at = $3
         WHERE org_id = $1 AND secret_key = $2`,
        [ref.orgId, ref.key, now]
      );

      await query(
        `INSERT INTO provider_credential_audit (org_id, secret_key, action, actor, occurred_at)
         VALUES ($1, $2, 'delete', $3, $4)`,
        [ref.orgId, ref.key, actor, now]
      );
    },

    async audit(ref: SecretRef) {
      const rows = await query<AuditRow>(
        `SELECT action, actor, occurred_at FROM provider_credential_audit
         WHERE org_id = $1 AND secret_key = $2
         ORDER BY occurred_at DESC`,
        [ref.orgId, ref.key]
      );

      return rows.map((row) => ({
        action: row.action as SecretAuditEntry["action"],
        occurredAt: row.occurred_at,
        actor: row.actor,
      }));
    },

    async listVersions(ref: SecretRef) {
      const rows = await query<{ occurred_at: string; actor: string }>(
        `SELECT occurred_at, actor FROM provider_credential_audit
         WHERE org_id = $1 AND secret_key = $2 AND action = 'rotate'
         ORDER BY occurred_at DESC`,
        [ref.orgId, ref.key]
      );

      return rows.map((row, i) => ({
        version: rows.length - i,
        rotatedAt: row.occurred_at,
        actor: row.actor,
      } as SecretVersion));
    },
  };
}
