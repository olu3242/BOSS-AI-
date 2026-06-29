import type { IntegrationAccount, CredentialReference } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { IntegrationAccountRepository } from "../types.js";

interface AccountRow {
  id: string;
  org_id: string;
  business_id: string;
  provider_key: string;
  status: IntegrationAccount["status"];
  connected_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CredentialRow {
  id: string;
  org_id: string;
  integration_account_id: string;
  secret_ref: string;
  rotated_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toAccount(row: AccountRow): IntegrationAccount {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    providerKey: row.provider_key,
    status: row.status,
    connectedAt: row.connected_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toCredential(row: CredentialRow): CredentialReference {
  return {
    id: row.id,
    orgId: row.org_id,
    integrationAccountId: row.integration_account_id,
    secretRef: row.secret_ref,
    rotatedAt: row.rotated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresIntegrationAccountRepository(): IntegrationAccountRepository {
  return {
    async upsert(input) {
      const rows = await query<AccountRow>(
        `INSERT INTO integration_accounts (org_id, business_id, provider_key, status, connected_at, version)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (business_id, provider_key) DO UPDATE SET
           status = EXCLUDED.status, connected_at = EXCLUDED.connected_at, version = EXCLUDED.version, updated_at = now()
         RETURNING *`,
        [input.orgId, input.businessId, input.providerKey, input.status, input.connectedAt, input.version]
      );
      return toAccount(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<AccountRow>(
        `SELECT * FROM integration_accounts WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [orgId, businessId]
      );
      return rows.map(toAccount);
    },
    async findByProvider(orgId, businessId, providerKey) {
      const rows = await query<AccountRow>(
        `SELECT * FROM integration_accounts WHERE org_id = $1 AND business_id = $2 AND provider_key = $3 AND deleted_at IS NULL`,
        [orgId, businessId, providerKey]
      );
      const row = rows[0];
      return row ? toAccount(row) : null;
    },
    async addCredentialReference(integrationAccountId, input) {
      const rows = await query<CredentialRow>(
        `INSERT INTO credential_references (org_id, integration_account_id, secret_ref, rotated_at)
         VALUES ((SELECT org_id FROM integration_accounts WHERE id = $1), $1, $2, $3)
         RETURNING *`,
        [integrationAccountId, input.secretRef, input.rotatedAt]
      );
      return toCredential(firstRow(rows));
    },
  };
}
