import type { BusinessMRI, BusinessMriSection, BusinessMriResponse, MriSectionKey } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessMriRepository } from "../types.js";

interface MriRow {
  id: string;
  org_id: string;
  business_id: string;
  version: string;
  status: BusinessMRI["status"];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SectionRow {
  id: string;
  org_id: string;
  business_mri_id: string;
  section_key: MriSectionKey;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ResponseRow {
  id: string;
  org_id: string;
  business_mri_id: string;
  section_key: MriSectionKey;
  question_key: string;
  value: unknown;
  answered_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toMri(row: MriRow): BusinessMRI {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    version: row.version,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toSection(row: SectionRow): BusinessMriSection {
  return {
    id: row.id,
    orgId: row.org_id,
    businessMriId: row.business_mri_id,
    sectionKey: row.section_key,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toResponse(row: ResponseRow): BusinessMriResponse {
  return {
    id: row.id,
    orgId: row.org_id,
    businessMriId: row.business_mri_id,
    sectionKey: row.section_key,
    questionKey: row.question_key,
    value: row.value,
    answeredAt: row.answered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessMriRepository(): BusinessMriRepository {
  return {
    async create(input) {
      const rows = await query<MriRow>(
        `INSERT INTO business_mri (org_id, business_id, version, status, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.orgId, input.businessId, input.version, input.status, input.startedAt, input.completedAt]
      );
      return toMri(firstRow(rows));
    },
    async update(orgId, id, patch) {
      const rows = await query<MriRow>(
        `UPDATE business_mri SET
           status = COALESCE($3, status),
           started_at = COALESCE($4, started_at),
           completed_at = COALESCE($5, completed_at),
           updated_at = now()
         WHERE org_id = $1 AND id = $2
         RETURNING *`,
        [orgId, id, patch.status ?? null, patch.startedAt ?? null, patch.completedAt ?? null]
      );
      return toMri(firstRow(rows));
    },
    async findByBusinessId(orgId, businessId) {
      const rows = await query<MriRow>(
        `SELECT * FROM business_mri WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
        [orgId, businessId]
      );
      return rows[0] ? toMri(rows[0]) : null;
    },
    async upsertSection(input) {
      const rows = await query<SectionRow>(
        `INSERT INTO business_mri_sections (org_id, business_mri_id, section_key, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (business_mri_id, section_key) DO UPDATE SET
           started_at = EXCLUDED.started_at,
           completed_at = EXCLUDED.completed_at,
           updated_at = now()
         RETURNING *`,
        [input.orgId, input.businessMriId, input.sectionKey, input.startedAt, input.completedAt]
      );
      return toSection(firstRow(rows));
    },
    async listSections(orgId, businessMriId) {
      const rows = await query<SectionRow>(
        `SELECT * FROM business_mri_sections WHERE org_id = $1 AND business_mri_id = $2 AND deleted_at IS NULL ORDER BY created_at`,
        [orgId, businessMriId]
      );
      return rows.map(toSection);
    },
    async upsertResponse(input) {
      const rows = await query<ResponseRow>(
        `INSERT INTO business_mri_responses (org_id, business_mri_id, section_key, question_key, value, answered_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (business_mri_id, question_key) DO UPDATE SET
           value = EXCLUDED.value,
           answered_at = EXCLUDED.answered_at,
           updated_at = now()
         RETURNING *`,
        [input.orgId, input.businessMriId, input.sectionKey, input.questionKey, JSON.stringify(input.value), input.answeredAt]
      );
      return toResponse(firstRow(rows));
    },
    async listResponses(orgId, businessMriId) {
      const rows = await query<ResponseRow>(
        `SELECT * FROM business_mri_responses WHERE org_id = $1 AND business_mri_id = $2 AND deleted_at IS NULL ORDER BY created_at`,
        [orgId, businessMriId]
      );
      return rows.map(toResponse);
    },
  };
}
