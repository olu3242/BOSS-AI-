import { nowIso } from "@boss/shared";
import { analyzeRootCauses, type RootCauseAnalysisResult } from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";

export interface RootCauseService {
  /**
   * Deterministic causal chain analysis. Reads existing constraints, health,
   * and recommendations from repos; calls MCP intelligence; emits domain event.
   * No AI inference — all causal logic is declarative in MCP (Law 1).
   */
  analyze(orgId: string, businessId: string): Promise<RootCauseAnalysisResult>;
}

export function createRootCauseService(repos: RepositoryContainer): RootCauseService {
  return {
    async analyze(orgId, businessId) {
      const detectedAt = nowIso();

      const [constraints, health, recommendations] = await Promise.all([
        repos.businessConstraints.listByBusinessId(orgId, businessId),
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businessRecommendations.listByBusinessId(orgId, businessId),
      ]);

      if (!health) {
        return {
          chains: [],
          primaryRootCause: null,
          summary: "No health data available — run health analysis first.",
          detectedAt,
        };
      }

      const result = analyzeRootCauses(constraints, health, recommendations, detectedAt);

      if (result.chains.length > 0) {
        await repos.eventBus.publish({
          type: "business.rootcause.detected",
          payload: {
            orgId,
            businessId,
            primaryRootCause: result.primaryRootCause,
            chainCount: result.chains.length,
            detectedAt,
          },
          occurredAt: detectedAt,
        });
      }

      return result;
    },
  };
}
