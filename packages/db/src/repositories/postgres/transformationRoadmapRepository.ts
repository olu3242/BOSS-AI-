import type { TransformationRoadmap, TransformationRoadmapStageEntry } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { TransformationRoadmapRepository } from "../types.js";

interface RoadmapRow {
  id: string;
  org_id: string;
  business_id: string;
  generated_at: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface StageRow {
  stage: TransformationRoadmapStageEntry["stage"];
  recommendation_ids: string[];
}

function toRoadmap(row: RoadmapRow, stages: TransformationRoadmapStageEntry[]): TransformationRoadmap {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    stages,
    generatedAt: row.generated_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: null,
  };
}

export function createPostgresTransformationRoadmapRepository(): TransformationRoadmapRepository {
  return {
    async upsert(input) {
      const existing = await query<RoadmapRow>(
        `SELECT * FROM transformation_roadmaps WHERE org_id = $1 AND business_id = $2`,
        [input.orgId, input.businessId]
      );

      let roadmapRow: RoadmapRow;
      if (existing[0]) {
        const rows = await query<RoadmapRow>(
          `UPDATE transformation_roadmaps SET generated_at = $3, version = $4, updated_at = now()
           WHERE org_id = $1 AND business_id = $2
           RETURNING *`,
          [input.orgId, input.businessId, input.generatedAt, input.version]
        );
        roadmapRow = firstRow(rows);
        await query(`DELETE FROM transformation_roadmap_stages WHERE transformation_roadmap_id = $1`, [roadmapRow.id]);
      } else {
        const rows = await query<RoadmapRow>(
          `INSERT INTO transformation_roadmaps (org_id, business_id, generated_at, version)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [input.orgId, input.businessId, input.generatedAt, input.version]
        );
        roadmapRow = firstRow(rows);
      }

      for (const stageEntry of input.stages) {
        await query(
          `INSERT INTO transformation_roadmap_stages (org_id, transformation_roadmap_id, stage, recommendation_ids)
           VALUES ($1, $2, $3, $4)`,
          [input.orgId, roadmapRow.id, stageEntry.stage, JSON.stringify(stageEntry.recommendationIds)]
        );
      }

      return toRoadmap(roadmapRow, input.stages);
    },
    async findByBusinessId(orgId, businessId) {
      const rows = await query<RoadmapRow>(
        `SELECT * FROM transformation_roadmaps WHERE org_id = $1 AND business_id = $2`,
        [orgId, businessId]
      );
      const row = rows[0];
      if (!row) return null;
      const stageRows = await query<StageRow>(
        `SELECT stage, recommendation_ids FROM transformation_roadmap_stages WHERE transformation_roadmap_id = $1`,
        [row.id]
      );
      const stages: TransformationRoadmapStageEntry[] = stageRows.map((s) => ({
        stage: s.stage,
        recommendationIds: s.recommendation_ids,
      }));
      return toRoadmap(row, stages);
    },
  };
}
