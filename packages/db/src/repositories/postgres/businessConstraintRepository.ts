import type { BusinessConstraint, ConstraintEvidenceItem } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessConstraintRepository, StoredConstraintEvidence } from "../types.js";

interface ConstraintRow {
  id: string;
  org_id: string;
  business_id: string;
  definition_key: string;
  title: string;
  description: string;
  category_key: string;
  severity: BusinessConstraint["severity"];
  confidence: string;
  business_impact: string;
  revenue_loss_annual: string;
  time_lost_hours_weekly: string;
  customer_impact: string;
  operational_impact: string;
  growth_limitation: string;
  owner_stress: string;
  automation_potential: string;
  business_owner: string;
  dependencies: string[];
  status: BusinessConstraint["status"];
  date_detected: string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface EvidenceRow {
  id: string;
  constraint_instance_id: string;
  source: ConstraintEvidenceItem["source"];
  description: string;
  data: Record<string, unknown>;
  created_at: string;
}

function toConstraint(row: ConstraintRow, evidence: ConstraintEvidenceItem[]): BusinessConstraint {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    definitionKey: row.definition_key,
    title: row.title,
    description: row.description,
    category: row.category_key as BusinessConstraint["category"],
    severity: row.severity,
    confidence: Number(row.confidence),
    businessImpact: row.business_impact,
    financialImpact: {
      revenueLossAnnual: Number(row.revenue_loss_annual),
      timeLostHoursWeekly: Number(row.time_lost_hours_weekly),
      customerImpact: row.customer_impact as "low" | "medium" | "high",
      operationalFriction: row.operational_impact as "low" | "medium" | "high",
      growthLimitation: row.growth_limitation as "low" | "medium" | "high",
      ownerStress: row.owner_stress as "low" | "medium" | "high",
      confidence: Number(row.confidence),
    },
    customerImpact: row.customer_impact as "low" | "medium" | "high",
    operationalImpact: row.operational_impact as "low" | "medium" | "high",
    automationPotential: row.automation_potential as "low" | "medium" | "high",
    businessOwner: row.business_owner,
    evidence,
    dependencies: row.dependencies,
    status: row.status,
    dateDetected: row.date_detected,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toEvidence(row: EvidenceRow): StoredConstraintEvidence {
  return {
    id: row.id,
    constraintId: row.constraint_instance_id,
    source: row.source,
    description: row.description,
    data: row.data,
    createdAt: row.created_at,
  };
}

export function createPostgresBusinessConstraintRepository(): BusinessConstraintRepository {
  return {
    async create(input) {
      const rows = await query<ConstraintRow>(
        `INSERT INTO constraint_instances
           (org_id, business_id, definition_key, title, description, category_key, severity, confidence,
            business_impact, revenue_loss_annual, time_lost_hours_weekly, customer_impact, operational_impact,
            growth_limitation, owner_stress, automation_potential, business_owner, dependencies, status,
            date_detected, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.definitionKey,
          input.title,
          input.description,
          input.category,
          input.severity,
          input.confidence,
          input.businessImpact,
          input.financialImpact.revenueLossAnnual,
          input.financialImpact.timeLostHoursWeekly,
          input.customerImpact,
          input.operationalImpact,
          input.financialImpact.growthLimitation,
          input.financialImpact.ownerStress,
          input.automationPotential,
          input.businessOwner,
          JSON.stringify(input.dependencies),
          input.status,
          input.dateDetected,
          input.version,
        ]
      );
      return toConstraint(firstRow(rows), []);
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<ConstraintRow>(
        `SELECT * FROM constraint_instances WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at`,
        [orgId, businessId]
      );
      const result: BusinessConstraint[] = [];
      for (const row of rows) {
        const evidenceRows = await query<EvidenceRow>(
          `SELECT * FROM constraint_evidence WHERE constraint_instance_id = $1 ORDER BY created_at`,
          [row.id]
        );
        result.push(toConstraint(row, evidenceRows.map(toEvidence)));
      }
      return result;
    },
    async findById(orgId, id) {
      const rows = await query<ConstraintRow>(
        `SELECT * FROM constraint_instances WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      const row = rows[0];
      if (!row) return null;
      const evidenceRows = await query<EvidenceRow>(
        `SELECT * FROM constraint_evidence WHERE constraint_instance_id = $1 ORDER BY created_at`,
        [row.id]
      );
      return toConstraint(row, evidenceRows.map(toEvidence));
    },
    async updateStatus(orgId, id, status) {
      const rows = await query<ConstraintRow>(
        `UPDATE constraint_instances SET status = $3, updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, status]
      );
      const evidenceRows = await query<EvidenceRow>(
        `SELECT * FROM constraint_evidence WHERE constraint_instance_id = $1 ORDER BY created_at`,
        [id]
      );
      return toConstraint(firstRow(rows), evidenceRows.map(toEvidence));
    },
    async addEvidence(constraintId, evidence) {
      const rows = await query<EvidenceRow>(
        `INSERT INTO constraint_evidence (org_id, constraint_instance_id, source, description, data)
         VALUES ((SELECT org_id FROM constraint_instances WHERE id = $1), $1, $2, $3, $4)
         RETURNING *`,
        [constraintId, evidence.source, evidence.description, JSON.stringify(evidence.data)]
      );
      return toEvidence(firstRow(rows));
    },
    async listEvidence(constraintId) {
      const rows = await query<EvidenceRow>(
        `SELECT * FROM constraint_evidence WHERE constraint_instance_id = $1 ORDER BY created_at`,
        [constraintId]
      );
      return rows.map(toEvidence);
    },
    async recordHistory(constraintId, previousStatus, newStatus, note) {
      await query(
        `INSERT INTO constraint_history (org_id, constraint_instance_id, previous_status, new_status, note)
         VALUES ((SELECT org_id FROM constraint_instances WHERE id = $1), $1, $2, $3, $4)`,
        [constraintId, previousStatus, newStatus, note]
      );
    },
  };
}
