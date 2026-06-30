export interface SecretRef {
  orgId: string;
  key: string;
}

export interface SecretMeta {
  providerKey: string;
  rotatedAt?: string;
  expiresAt?: string;
}

export interface SecretAuditEntry {
  action: "get" | "put" | "rotate" | "delete";
  occurredAt: string;
  actor: string;
}

/**
 * Abstraction over an external secret store. Implementations must never log or
 * return plaintext values in audit entries. The key within SecretRef is the
 * same string stored in credential_references.secret_ref.
 *
 * Goal 16B provides EnvSecretStore (dev/test placeholder, TD-014 partially
 * resolved) and EncryptedInMemorySecretStore (AES-256-GCM, dev/test).
 * A production KMS-backed implementation (Vault, AWS Secrets Manager) is
 * the next resolution step for TD-014.
 */
export interface SecretVersion {
  version: number;
  rotatedAt: string;
  actor: string;
}

export interface SecretStore {
  get(ref: SecretRef, actor: string): Promise<string | null>;
  put(ref: SecretRef, value: string, meta: SecretMeta): Promise<void>;
  rotate(ref: SecretRef, newValue: string, actor: string): Promise<void>;
  delete(ref: SecretRef, actor: string): Promise<void>;
  audit(ref: SecretRef): Promise<SecretAuditEntry[]>;
  /** Returns version history for the secret (newest first). */
  listVersions(ref: SecretRef): Promise<SecretVersion[]>;
}
