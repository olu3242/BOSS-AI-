import type {
  BusinessDiagnosticReport,
  DiagnosticAreaScore,
  DiagnosticExecutiveSummary,
  DiagnosticMaturityAssessment,
  DiagnosticOpportunity,
  DiagnosticPriorityItem,
  DiagnosticRootCause,
} from "@boss/types";
import { query, withTransaction } from "../../client.js";
import type { BusinessDiagnosticRepository } from "../types.js";

interface ReportRow {
  id: string;
  org_id: string;
  business_id: string;
  business_mri_id: string;
  weight_profile_id: string;
  weight_profile_version: string;
  overall_health: string;
  confidence: string;
  executive_summary: DiagnosticExecutiveSummary;
  generated_at: string;
  version: number;
}

interface AreaRow {
  area: DiagnosticAreaScore["area"];
  current_score: string;
  desired_score: string;
  gap: string;
  trend: DiagnosticAreaScore["trend"];
  confidence: string;
  business_impact: string;
  priority: string;
  evidence: DiagnosticAreaScore["evidence"];
  recommended_improvement: string;
}

interface RootCauseRow {
  constraint_id: string;
  area: DiagnosticRootCause["area"];
  kind: DiagnosticRootCause["kind"];
  title: string;
  description: string;
  business_impact: string;
  confidence: string;
  dependencies: string[];
  evidence: DiagnosticRootCause["evidence"];
}

interface OpportunityRow {
  recommendation_id: string;
  opportunity_type: DiagnosticOpportunity["type"];
  title: string;
  description: string;
  expected_impact: string;
  effort: string;
  confidence: string;
  priority: string;
  evidence: DiagnosticOpportunity["evidence"];
}

interface MaturityRow {
  area: DiagnosticMaturityAssessment["area"];
  maturity_level: DiagnosticMaturityAssessment["level"];
  score: string;
  rationale: string;
  confidence: string;
  evidence: DiagnosticMaturityAssessment["evidence"];
}

interface PriorityRow {
  source_type: DiagnosticPriorityItem["sourceType"];
  source_id: string;
  impact: string;
  urgency: string;
  effort: string;
  confidence: string;
  score: string;
  rank: number;
}

async function loadReport(row: ReportRow): Promise<BusinessDiagnosticReport> {
  const [areaRows, rootRows, opportunityRows, maturityRows, priorityRows] =
    await Promise.all([
      query<AreaRow>(
        `SELECT * FROM diagnostic_area_scores
         WHERE org_id = $1 AND diagnostic_report_id = $2
         ORDER BY area`,
        [row.org_id, row.id],
      ),
      query<RootCauseRow>(
        `SELECT * FROM diagnostic_root_causes
         WHERE org_id = $1 AND diagnostic_report_id = $2
         ORDER BY kind, title`,
        [row.org_id, row.id],
      ),
      query<OpportunityRow>(
        `SELECT * FROM diagnostic_opportunities
         WHERE org_id = $1 AND diagnostic_report_id = $2
         ORDER BY priority DESC`,
        [row.org_id, row.id],
      ),
      query<MaturityRow>(
        `SELECT * FROM diagnostic_maturity_assessments
         WHERE org_id = $1 AND diagnostic_report_id = $2
         ORDER BY area`,
        [row.org_id, row.id],
      ),
      query<PriorityRow>(
        `SELECT * FROM diagnostic_priority_items
         WHERE org_id = $1 AND diagnostic_report_id = $2
         ORDER BY rank`,
        [row.org_id, row.id],
      ),
    ]);

  return Object.freeze({
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    businessMriId: row.business_mri_id,
    weightProfileId: row.weight_profile_id,
    weightProfileVersion: row.weight_profile_version,
    overallHealth: Number(row.overall_health),
    confidence: Number(row.confidence),
    areaScores: Object.freeze(
      areaRows.map((area) => ({
        area: area.area,
        currentScore: Number(area.current_score),
        desiredScore: Number(area.desired_score),
        gap: Number(area.gap),
        trend: area.trend,
        confidence: Number(area.confidence),
        businessImpact: Number(area.business_impact),
        priority: Number(area.priority),
        evidence: area.evidence,
        recommendedImprovement: area.recommended_improvement,
      })),
    ),
    rootCauses: Object.freeze(
      rootRows.map((root) => ({
        id: root.constraint_id,
        constraintId: root.constraint_id,
        area: root.area,
        kind: root.kind,
        title: root.title,
        description: root.description,
        businessImpact: root.business_impact,
        confidence: Number(root.confidence),
        dependencies: root.dependencies,
        evidence: root.evidence,
      })),
    ),
    opportunities: Object.freeze(
      opportunityRows.map((opportunity) => ({
        id: opportunity.recommendation_id,
        recommendationId: opportunity.recommendation_id,
        type: opportunity.opportunity_type,
        title: opportunity.title,
        description: opportunity.description,
        expectedImpact: Number(opportunity.expected_impact),
        effort: Number(opportunity.effort),
        confidence: Number(opportunity.confidence),
        priority: Number(opportunity.priority),
        evidence: opportunity.evidence,
      })),
    ),
    maturity: Object.freeze(
      maturityRows.map((maturity) => ({
        area: maturity.area,
        level: maturity.maturity_level,
        score: Number(maturity.score),
        rationale: maturity.rationale,
        confidence: Number(maturity.confidence),
        evidence: maturity.evidence,
      })),
    ),
    priorities: Object.freeze(
      priorityRows.map((priority) => ({
        sourceType: priority.source_type,
        sourceId: priority.source_id,
        impact: Number(priority.impact),
        urgency: Number(priority.urgency),
        effort: Number(priority.effort),
        confidence: Number(priority.confidence),
        score: Number(priority.score),
        rank: priority.rank,
      })),
    ),
    summary: Object.freeze(row.executive_summary),
    generatedAt: row.generated_at,
    version: row.version,
  });
}

export function createPostgresBusinessDiagnosticRepository(): BusinessDiagnosticRepository {
  return {
    async save(report) {
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE diagnostic_reports
           SET status = 'superseded', updated_at = now()
           WHERE org_id = $1 AND business_id = $2 AND status = 'completed'`,
          [report.orgId, report.businessId],
        );
        await client.query(
          `INSERT INTO diagnostic_reports (
             id, org_id, business_id, business_mri_id, weight_profile_id,
             weight_profile_version, overall_health, confidence,
             executive_summary, generated_at, version
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)`,
          [
            report.id,
            report.orgId,
            report.businessId,
            report.businessMriId,
            report.weightProfileId,
            report.weightProfileVersion,
            report.overallHealth,
            report.confidence,
            JSON.stringify(report.summary),
            report.generatedAt,
            report.version,
          ],
        );

        for (const area of report.areaScores) {
          await client.query(
            `INSERT INTO diagnostic_area_scores (
               diagnostic_report_id, org_id, area, current_score, desired_score,
               gap, trend, confidence, business_impact, priority, evidence,
               recommended_improvement
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)`,
            [
              report.id,
              report.orgId,
              area.area,
              area.currentScore,
              area.desiredScore,
              area.gap,
              area.trend,
              area.confidence,
              area.businessImpact,
              area.priority,
              JSON.stringify(area.evidence),
              area.recommendedImprovement,
            ],
          );
        }
        for (const root of report.rootCauses) {
          await client.query(
            `INSERT INTO diagnostic_root_causes (
               diagnostic_report_id, org_id, constraint_id, area, kind, title,
               description, business_impact, confidence, dependencies, evidence
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)`,
            [
              report.id,
              report.orgId,
              root.constraintId,
              root.area,
              root.kind,
              root.title,
              root.description,
              root.businessImpact,
              root.confidence,
              JSON.stringify(root.dependencies),
              JSON.stringify(root.evidence),
            ],
          );
        }
        for (const opportunity of report.opportunities) {
          await client.query(
            `INSERT INTO diagnostic_opportunities (
               diagnostic_report_id, org_id, recommendation_id,
               opportunity_type, title, description, expected_impact, effort,
               confidence, priority, evidence
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
            [
              report.id,
              report.orgId,
              opportunity.recommendationId,
              opportunity.type,
              opportunity.title,
              opportunity.description,
              opportunity.expectedImpact,
              opportunity.effort,
              opportunity.confidence,
              opportunity.priority,
              JSON.stringify(opportunity.evidence),
            ],
          );
        }
        for (const maturity of report.maturity) {
          await client.query(
            `INSERT INTO diagnostic_maturity_assessments (
               diagnostic_report_id, org_id, area, maturity_level, score,
               rationale, confidence, evidence
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
            [
              report.id,
              report.orgId,
              maturity.area,
              maturity.level,
              maturity.score,
              maturity.rationale,
              maturity.confidence,
              JSON.stringify(maturity.evidence),
            ],
          );
        }
        for (const priority of report.priorities) {
          await client.query(
            `INSERT INTO diagnostic_priority_items (
               diagnostic_report_id, org_id, source_type, source_id, impact,
               urgency, effort, confidence, score, rank
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              report.id,
              report.orgId,
              priority.sourceType,
              priority.sourceId,
              priority.impact,
              priority.urgency,
              priority.effort,
              priority.confidence,
              priority.score,
              priority.rank,
            ],
          );
        }
      });
    },
    async findLatest(orgId, businessId) {
      const rows = await query<ReportRow>(
        `SELECT * FROM diagnostic_reports
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY version DESC
         LIMIT 1`,
        [orgId, businessId],
      );
      return rows[0] ? loadReport(rows[0]) : null;
    },
    async listVersions(orgId, businessId) {
      const rows = await query<ReportRow>(
        `SELECT * FROM diagnostic_reports
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY version DESC`,
        [orgId, businessId],
      );
      return Promise.all(rows.map(loadReport));
    },
  };
}
