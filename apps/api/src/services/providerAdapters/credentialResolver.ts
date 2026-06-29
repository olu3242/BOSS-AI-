import type { RepositoryContainer } from "../../container.js";
import type { ResolvedCredential } from "./types.js";

/**
 * Placeholder credential resolver for Goal 16. Resolves a CredentialReference's
 * secretRef to a value by reading process.env[secretRef] — there is no real
 * secret store yet (TD-014). Encryption, rotation, and versioning are deferred
 * to Goal 17 (Secret Vault & Credential Management); this must not be mistaken
 * for a production-grade implementation.
 */
export interface CredentialResolver {
  resolve(orgId: string, businessId: string, providerKey: string): Promise<ResolvedCredential | null>;
}

export function createCredentialResolver(repos: RepositoryContainer): CredentialResolver {
  return {
    async resolve(orgId, businessId, providerKey) {
      const account = await repos.integrationAccounts.findByProvider(orgId, businessId, providerKey);
      if (!account || account.status !== "connected") {
        return null;
      }
      const credential = await repos.integrationAccounts.findCredentialByAccount(account.id);
      if (!credential) {
        return null;
      }
      const value = process.env[credential.secretRef];
      if (!value) {
        return null;
      }
      return { secretRef: credential.secretRef, value };
    },
  };
}
