/**
 * OrgHealthService — aggregate health view across all businesses in an org.
 *
 * Provides the platform-level "portfolio health" that powers the Mission
 * Control org dashboard. Reads from existing repositories only — owns no state.
 */
import type { RepositoryContainer } from "../container.js";
import type { BteService } from "./bteService.js";
import type { AiWorkforceService } from "./aiWorkforceService.js";

export interface BusinessHealthSummary {
  businessId: string;
  overallScore: number | null;
  generatedAt: string | null;
  bteCycleStatus: "scheduled" | "not_scheduled";
  activeEmployeeCount: number;
  pendingDecisionCount: number;
}

export interface OrgHealthSummary {
  orgId: string;
  businessCount: number;
  averageHealthScore: number | null;
  healthScoreDistribution: {
    critical: number;  // < 40
    warning: number;   // 40–69
    healthy: number;   // 70–100
  };
  bteCoverage: number; // fraction of businesses with BTE scheduled
  totalActiveEmployees: number;
  totalPendingDecisions: number;
  businesses: BusinessHealthSummary[];
  generatedAt: string;
}

export interface OrgHealthService {
  getOrgSummary(orgId: string): Promise<OrgHealthSummary>;
  getBusinessSummary(orgId: string, businessId: string): Promise<BusinessHealthSummary>;
}

export function createOrgHealthService(
  repos: RepositoryContainer,
  bte: BteService,
  aiWorkforce: AiWorkforceService
): OrgHealthService {
  return {
    async getBusinessSummary(orgId, businessId) {
      const [health, decisions, activeEmployees, scheduled] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businessDecisions.listByBusinessId(orgId, businessId),
        aiWorkforce.listActiveForOrg(orgId),
        bte.listScheduled(orgId),
      ]);

      const pendingDecisions = decisions.filter(
        (d) => d.status === "generated" || d.status === "reviewed"
      );

      const bteCycleStatus = scheduled.some((s) => s.businessId === businessId)
        ? ("scheduled" as const)
        : ("not_scheduled" as const);

      return {
        businessId,
        overallScore: health?.overallScore ?? null,
        generatedAt: health?.generatedAt ?? null,
        bteCycleStatus,
        activeEmployeeCount: activeEmployees.length,
        pendingDecisionCount: pendingDecisions.length,
      };
    },

    async getOrgSummary(orgId) {
      const generatedAt = new Date().toISOString();
      const [allBusinesses, allDecisions, scheduled, activeEmployees] = await Promise.all([
        repos.businesses.list(orgId),
        repos.eventLog.listByOrgId(orgId),
        bte.listScheduled(orgId),
        aiWorkforce.listActiveForOrg(orgId),
      ]);

      const distribution = { critical: 0, warning: 0, healthy: 0 };
      let scoreSum = 0;
      let scoredCount = 0;

      const businessSummaries = await Promise.all(
        allBusinesses.map(async (business): Promise<BusinessHealthSummary> => {
          const [health, decisions] = await Promise.all([
            repos.businessHealth.findByBusinessId(orgId, business.id),
            repos.businessDecisions.listByBusinessId(orgId, business.id),
          ]);

          if (health) {
            scoreSum += health.overallScore;
            scoredCount++;
            if (health.overallScore < 40) distribution.critical++;
            else if (health.overallScore < 70) distribution.warning++;
            else distribution.healthy++;
          }

          const pendingDecisions = decisions.filter(
            (d) => d.status === "generated" || d.status === "reviewed"
          );

          const bteCycleStatus = scheduled.some((s) => s.businessId === business.id)
            ? ("scheduled" as const)
            : ("not_scheduled" as const);

          return {
            businessId: business.id,
            overallScore: health?.overallScore ?? null,
            generatedAt: health?.generatedAt ?? null,
            bteCycleStatus,
            activeEmployeeCount: activeEmployees.length,
            pendingDecisionCount: pendingDecisions.length,
          };
        })
      );

      const scheduledCount = scheduled.length;
      const bteCoverage = allBusinesses.length > 0
        ? scheduledCount / allBusinesses.length
        : 0;

      const totalPendingDecisions = allDecisions.filter(
        (e) => e.type === "business.decision.generated"
      ).length;

      return {
        orgId,
        businessCount: allBusinesses.length,
        averageHealthScore: scoredCount > 0 ? Math.round(scoreSum / scoredCount) : null,
        healthScoreDistribution: distribution,
        bteCoverage,
        totalActiveEmployees: activeEmployees.length,
        totalPendingDecisions,
        businesses: businessSummaries,
        generatedAt,
      };
    },
  };
}
