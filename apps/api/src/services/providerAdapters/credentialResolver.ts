import type { RepositoryContainer } from "../../container.js";
import type { SecretStore } from "../secretVault/index.js";
import type { ResolvedCredential } from "./types.js";

export interface CredentialResolver {
  resolve(orgId: string, businessId: string, providerKey: string): Promise<ResolvedCredential | null>;
}

export function createCredentialResolver(repos: RepositoryContainer, secretStore: SecretStore): CredentialResolver {
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
      const value = await secretStore.get({ orgId, key: credential.secretRef }, "credential-resolver");
      if (!value) {
        return null;
      }
      return { secretRef: credential.secretRef, value };
    },
  };
}
