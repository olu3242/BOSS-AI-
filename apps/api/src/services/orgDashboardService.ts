import type { BusinessDecision } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface OrgDashboardSummary {
  businessCount: number;
  healthDistribution: {
    excellent: number;
    good: number;
    needsAttention: number;
    critical: number;
  };
  topAlerts: Array<{
    businessId: string;
    businessName: string;
    healthScore: number;
  }>;
  recentDecisions: Array<{
    id: string;
    businessId: string;
    businessName: string;
    objective: string;
    status: string;
    createdAt: string;
  }>;
  pendingApprovalsCount: number;
  revenueAtRisk: number;
}

export interface OrgDashboardService {
  get(orgId: string): Promise<OrgDashboardSummary>;
}

function isPendingDecision(decision: BusinessDecision): boolean {
  return decision.status === "generated" || decision.status === "reviewed";
}

export function createOrgDashboardService(repos: RepositoryContainer): OrgDashboardService {
  return {
    async get(orgId) {
      const businesses = await repos.businesses.list(orgId);
      const distribution = {
        excellent: 0,
        good: 0,
        needsAttention: 0,
        critical: 0,
      };

      let pendingApprovalsCount = 0;
      let revenueAtRiskCents = 0;
      const topAlerts: OrgDashboardSummary["topAlerts"] = [];
      const recentDecisions: OrgDashboardSummary["recentDecisions"] = [];

      await Promise.all(
        businesses.map(async (business) => {
          const [health, decisions, recommendations, invoices] = await Promise.all([
            repos.businessHealth.findByBusinessId(orgId, business.id),
            repos.businessDecisions.listByBusinessId(orgId, business.id),
            repos.businessRecommendations.listByBusinessId(orgId, business.id),
            repos.invoices.listByBusiness(orgId, business.id),
          ]);

          if (health) {
            if (health.overallScore >= 80) distribution.excellent++;
            else if (health.overallScore >= 60) distribution.good++;
            else if (health.overallScore >= 40) distribution.needsAttention++;
            else distribution.critical++;

            if (health.overallScore < 60) {
              topAlerts.push({
                businessId: business.id,
                businessName: business.name,
                healthScore: health.overallScore,
              });
            }
          }

          pendingApprovalsCount += decisions.filter(isPendingDecision).length;
          pendingApprovalsCount += recommendations.filter(
            (recommendation) => recommendation.status === "proposed",
          ).length;
          revenueAtRiskCents += invoices
            .filter((invoice) => invoice.status === "overdue")
            .reduce((sum, invoice) => sum + invoice.totalCents, 0);

          for (const decision of decisions) {
            recentDecisions.push({
              id: decision.id,
              businessId: business.id,
              businessName: business.name,
              objective: decision.objective,
              status: decision.status,
              createdAt: decision.createdAt,
            });
          }
        }),
      );

      topAlerts.sort((a, b) => a.healthScore - b.healthScore);
      recentDecisions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return {
        businessCount: businesses.length,
        healthDistribution: distribution,
        topAlerts: topAlerts.slice(0, 5),
        recentDecisions: recentDecisions.slice(0, 5),
        pendingApprovalsCount,
        revenueAtRisk: revenueAtRiskCents / 100,
      };
    },
  };
}
