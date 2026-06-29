import { nowIso } from "@boss/shared";
import { deriveBusinessHealth } from "@boss/mcp";
import type { BusinessHealth, BusinessHealthDimension } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface BusinessHealthService {
  generate(
    orgId: string,
    businessId: string,
    businessMriId: string
  ): Promise<{ health: BusinessHealth; dimensions: BusinessHealthDimension[] }>;
  getHealth(
    orgId: string,
    businessId: string
  ): Promise<{ health: BusinessHealth; dimensions: BusinessHealthDimension[] } | null>;
}

export function createBusinessHealthService(repos: RepositoryContainer): BusinessHealthService {
  return {
    async generate(orgId, businessId, businessMriId) {
      const responses = await repos.businessMri.listResponses(orgId, businessMriId);
      const derivedDimensions = deriveBusinessHealth(responses);
      const overall = derivedDimensions.find((dimension) => dimension.dimensionKey === "overall");

      const health = await repos.businessHealth.upsert({
        orgId,
        businessId,
        overallScore: overall?.score ?? 0,
        generatedAt: nowIso(),
      });

      const dimensions = await Promise.all(
        derivedDimensions.map((dimension) =>
          repos.businessHealth.upsertDimension({
            orgId,
            businessHealthId: health.id,
            dimensionKey: dimension.dimensionKey,
            score: dimension.score,
            confidence: dimension.confidence,
            trend: dimension.trend,
            evidence: dimension.evidence,
            status: dimension.status,
          })
        )
      );

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "business_health_updated",
        description: "Business Health Graph generated",
        metadata: {},
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "business.health.calculated",
        payload: { orgId, businessId, businessHealthId: health.id, overallScore: health.overallScore },
        occurredAt: nowIso(),
      });

      return { health, dimensions };
    },
    async getHealth(orgId, businessId) {
      const health = await repos.businessHealth.findByBusinessId(orgId, businessId);
      if (!health) {
        return null;
      }
      const dimensions = await repos.businessHealth.listDimensions(orgId, health.id);
      return { health, dimensions };
    },
  };
}
