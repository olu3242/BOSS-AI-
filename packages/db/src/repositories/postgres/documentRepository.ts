import type { Document, DocumentType, DocumentStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { DocumentRepository } from "../types.js";

interface DocumentRow {
  id: string;
  org_id: string;
  business_id: string;
  title: string;
  document_type: string;
  status: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    title: row.title,
    documentType: row.document_type as DocumentType,
    status: row.status as DocumentStatus,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    version: row.version,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresDocumentRepository(): DocumentRepository {
  return {
    async create(input) {
      const rows = await query<DocumentRow>(
        `INSERT INTO documents
           (org_id, business_id, title, document_type, status,
            storage_path, mime_type, size_bytes, version, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          input.orgId, input.businessId,
          input.title, input.documentType,
          input.status ?? "draft",
          input.storagePath ?? null,
          input.mimeType ?? null,
          input.sizeBytes ?? null,
          input.version ?? 1,
          input.tags ?? [],
        ]
      );
      return toDocument(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<DocumentRow>(
        `SELECT * FROM documents WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toDocument(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<DocumentRow>(
        `UPDATE documents
         SET title         = COALESCE($3, title),
             document_type = COALESCE($4, document_type),
             status        = COALESCE($5, status),
             storage_path  = COALESCE($6, storage_path),
             mime_type     = COALESCE($7, mime_type),
             size_bytes    = COALESCE($8, size_bytes),
             version       = COALESCE($9, version),
             tags          = COALESCE($10, tags),
             updated_at    = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.title ?? null, patch.documentType ?? null,
          patch.status ?? null, patch.storagePath ?? null,
          patch.mimeType ?? null, patch.sizeBytes ?? null,
          patch.version ?? null, patch.tags ?? null,
        ]
      );
      return toDocument(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE documents SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<DocumentRow>(
        `SELECT * FROM documents
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toDocument);
    },
  };
}
