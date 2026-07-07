import type {
  Conversation,
  ConversationChannel,
  ConversationDirection,
  ConversationStatus,
  ConversationSentiment,
} from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ConversationRepository } from "../types.js";

interface ConversationRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string | null;
  channel: string;
  direction: string;
  subject: string | null;
  body: string;
  status: string;
  assigned_to: string | null;
  sentiment: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    channel: row.channel as ConversationChannel,
    direction: row.direction as ConversationDirection,
    subject: row.subject,
    body: row.body,
    status: row.status as ConversationStatus,
    assignedTo: row.assigned_to,
    sentiment: row.sentiment as ConversationSentiment | null,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresConversationRepository(): ConversationRepository {
  return {
    async create(input) {
      const rows = await query<ConversationRow>(
        `INSERT INTO conversations
           (org_id, business_id, customer_id, channel, direction,
            subject, body, status, assigned_to, sentiment, occurred_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          input.orgId, input.businessId,
          input.customerId ?? null,
          input.channel, input.direction,
          input.subject ?? null,
          input.body,
          input.status ?? "open",
          input.assignedTo ?? null,
          input.sentiment ?? null,
          input.occurredAt ?? new Date().toISOString(),
        ]
      );
      return toConversation(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<ConversationRow>(
        `SELECT * FROM conversations WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toConversation(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<ConversationRow>(
        `UPDATE conversations
         SET subject     = COALESCE($3, subject),
             body        = COALESCE($4, body),
             status      = COALESCE($5, status),
             assigned_to = COALESCE($6, assigned_to),
             sentiment   = COALESCE($7, sentiment),
             updated_at  = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.subject ?? null, patch.body ?? null,
          patch.status ?? null, patch.assignedTo ?? null,
          patch.sentiment ?? null,
        ]
      );
      return toConversation(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE conversations SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId, limit = 50) {
      const rows = await query<ConversationRow>(
        `SELECT * FROM conversations
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY occurred_at DESC LIMIT $3`,
        [orgId, businessId, limit]
      );
      return rows.map(toConversation);
    },

    async listByCustomer(orgId, customerId) {
      const rows = await query<ConversationRow>(
        `SELECT * FROM conversations
         WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY occurred_at DESC`,
        [orgId, customerId]
      );
      return rows.map(toConversation);
    },
  };
}
