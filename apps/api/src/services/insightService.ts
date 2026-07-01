/**
 * InsightService — cross-business intelligence aggregation.
 *
 * Identifies patterns that emerge when multiple businesses in an org share
 * the same constraints, KPI weaknesses, or root causes. Surfaces these as
 * org-level insights so the owner can act at scale — one playbook for
 * many businesses at once.
 *
 * Law 1: reads from registries (MCP intelligence layer) and existing
 * repositories (Loop state). Emits no side effects; purely read-only.
 */
import { recommendationDefinitionRegistry } from "@boss/registries";
import type { RepositoryContainer } from "../container.js";

export interface ConstraintFrequency {
  constraintKey: string; // maps to BusinessConstraint.definitionKey
  businessCount: number;
  businessIds: string[];
  recommendedActionKey: string | null;
}

export interface OrgInsight {
  insightKey: string;
  title: string;
  description: string;
  affectedBusinessIds: string[];
  affectedBusinessCount: number;
  severity: "critical" | "warning" | "info";
  recommendedActionKey: string | null;
  recommendedActionTitle: string | null;
  detectedAt: string;
}

export interface OrgInsightSummary {
  orgId: string;
  totalInsights: number;
  criticalInsights: number;
  insights: OrgInsight[];
  topConstraint: ConstraintFrequency | null;
  generatedAt: string;
}

export interface InsightService {
  getOrgInsights(orgId: string): Promise<OrgInsightSummary>;
  getConstraintFrequencies(orgId: string): Promise<ConstraintFrequency[]>;
  getRecommendationTemplates(): Array<{ key: string; title: string; category: string; difficulty: string; automationPotential: string }>;
}

export function createInsightService(repos: RepositoryContainer): InsightService {
  return {
    getRecommendationTemplates() {
      return recommendationDefinitionRegistry.list().map((r) => ({
        key: r.key,
        title: r.label,
        category: r.category,
        difficulty: r.difficulty,
        automationPotential: r.automationPotential,
      }));
    },

    async getConstraintFrequencies(orgId) {
      const businesses = await repos.businesses.list(orgId);
      const constraintMap = new Map<string, string[]>();

      await Promise.all(
        businesses.map(async (biz) => {
          const constraints = await repos.businessConstraints.listByBusinessId(orgId, biz.id);
          for (const c of constraints) {
            if (!constraintMap.has(c.definitionKey)) {
              constraintMap.set(c.definitionKey, []);
            }
            constraintMap.get(c.definitionKey)!.push(biz.id);
          }
        })
      );

      const frequencies: ConstraintFrequency[] = [];
      for (const [constraintKey, bizIds] of constraintMap.entries()) {
        // Find the best matching recommendation for this constraint
        const recs = recommendationDefinitionRegistry.list();
        const matching = recs.find((r) =>
          r.triggerConstraintKeys?.includes(constraintKey)
        );

        frequencies.push({
          constraintKey,
          businessCount: bizIds.length,
          businessIds: bizIds,
          recommendedActionKey: matching?.key ?? null,
        });
      }

      return frequencies.sort((a, b) => b.businessCount - a.businessCount);
    },

    async getOrgInsights(orgId) {
      const generatedAt = new Date().toISOString();
      const [frequencies, businesses] = await Promise.all([
        this.getConstraintFrequencies(orgId),
        repos.businesses.list(orgId),
      ]);

      const insights: OrgInsight[] = [];
      const totalBusinesses = businesses.length;

      for (const freq of frequencies) {
        const pct = totalBusinesses > 0 ? freq.businessCount / totalBusinesses : 0;

        // Only surface cross-business insights (2+ businesses affected)
        if (freq.businessCount < 2) continue;

        const severity: OrgInsight["severity"] =
          pct >= 0.7 ? "critical"
          : pct >= 0.4 ? "warning"
          : "info";

        const rec = freq.recommendedActionKey
          ? recommendationDefinitionRegistry.get(freq.recommendedActionKey)
          : null;

        insights.push({
          insightKey: `cross_biz_${freq.constraintKey}`,
          title: `${freq.businessCount} businesses share constraint: ${freq.constraintKey.replace(/_/g, " ")}`,
          description: `${freq.businessCount} of ${totalBusinesses} businesses (${Math.round(pct * 100)}%) are experiencing the same constraint. Addressing it once at org level will compound the impact.`,
          affectedBusinessIds: freq.businessIds,
          affectedBusinessCount: freq.businessCount,
          severity,
          recommendedActionKey: freq.recommendedActionKey,
          recommendedActionTitle: rec?.label ?? null,
          detectedAt: generatedAt,
        });
      }

      const criticalInsights = insights.filter((i) => i.severity === "critical").length;
      const topConstraint = frequencies[0] ?? null;

      return {
        orgId,
        totalInsights: insights.length,
        criticalInsights,
        insights,
        topConstraint,
        generatedAt,
      };
    },
  };
}
