import { nowIso } from "@boss/shared";
import type { ExecutiveBriefingRecord, BriefingPeriod } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface ExecutiveBriefingService {
  generate(orgId: string, businessId: string, period?: BriefingPeriod): Promise<ExecutiveBriefingRecord>;
  getLatest(orgId: string, businessId: string, period?: BriefingPeriod): Promise<ExecutiveBriefingRecord | null>;
  list(orgId: string, businessId: string, limit?: number): Promise<ExecutiveBriefingRecord[]>;
}

function periodWindow(period: BriefingPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  switch (period) {
    case "daily": start.setDate(start.getDate() - 1); break;
    case "weekly": start.setDate(start.getDate() - 7); break;
    case "monthly": start.setMonth(start.getMonth() - 1); break;
    case "quarterly": start.setMonth(start.getMonth() - 3); break;
  }
  return { start, end };
}

export function createExecutiveBriefingService(repos: RepositoryContainer): ExecutiveBriefingService {
  return {
    async generate(orgId, businessId, period = "daily") {
      const generatedAt = nowIso();
      const { start, end } = periodWindow(period);

      const [health, constraints, recommendations, kpiReadings, goals] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businessConstraints.listByBusinessId(orgId, businessId),
        repos.businessRecommendations.listByBusinessId(orgId, businessId),
        repos.kpiReadings.listByBusinessId(orgId, businessId, 50),
        repos.businessGoals.listByBusinessId(orgId, businessId),
      ]);

      const activeConstraints = constraints.filter((c) => c.status === "active");
      const pendingRecs = recommendations.filter((r) => r.status === "proposed");
      const activeGoals = goals.filter((g) => g.status === "active");

      const healthScore = health?.overallScore ?? 0;
      const healthTrend = healthScore >= 70 ? "↑" : healthScore >= 50 ? "→" : "↓";

      const headline = healthScore >= 70
        ? `Business is performing well (Health: ${healthScore.toFixed(0)}/100)`
        : healthScore >= 50
        ? `Business needs attention (Health: ${healthScore.toFixed(0)}/100 — ${activeConstraints.length} active constraints)`
        : `Business requires immediate action (Health: ${healthScore.toFixed(0)}/100)`;

      const topPriorities: string[] = [
        ...activeConstraints.slice(0, 2).map((c) => `Resolve: ${c.title}`),
        ...pendingRecs.slice(0, 2).map((r) => `Action: ${r.title}`),
        ...activeGoals.slice(0, 1).map((g) => `Goal: ${g.title}`),
      ].slice(0, 5);

      const keyMetrics = kpiReadings
        .filter((r, idx, arr) => arr.findIndex((x) => x.kpiKey === r.kpiKey) === idx)
        .slice(0, 6)
        .map((r) => ({
          label: r.label,
          value: r.value !== null ? `${r.value.toFixed(1)} ${r.unit}` : "—",
          trend: r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "→",
        }));

      if (health) {
        keyMetrics.unshift({
          label: "Business Health",
          value: `${healthScore.toFixed(0)}/100`,
          trend: healthTrend,
        });
      }

      const alerts = activeConstraints.slice(0, 3).map((c) => ({
        severity: (c.severity === "critical" || c.severity === "high" ? "high"
          : c.severity === "medium" ? "medium" : "low") as "low" | "medium" | "high",
        message: c.title,
      }));

      const recSuggestions = pendingRecs.slice(0, 3).map((r) => r.title);

      const summary = [
        `Business health is ${healthScore.toFixed(0)}/100 ${healthTrend}.`,
        activeConstraints.length > 0
          ? `${activeConstraints.length} active constraint(s) require attention.`
          : "No critical constraints detected.",
        pendingRecs.length > 0
          ? `${pendingRecs.length} pending recommendation(s) ready for review.`
          : "All recommendations are current.",
        activeGoals.length > 0
          ? `${activeGoals.length} active goal(s) in progress.`
          : "",
      ].filter(Boolean).join(" ");

      const briefing = await repos.executiveBriefings.create({
        orgId,
        businessId,
        period,
        headline,
        summary,
        topPriorities,
        keyMetrics,
        alerts,
        recommendations: recSuggestions,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        generatedAt,
      });

      await repos.eventBus.publish({
        type: "business.briefing.generated",
        payload: { orgId, businessId, briefingId: briefing.id, period },
        occurredAt: generatedAt,
      });

      return briefing;
    },

    async getLatest(orgId, businessId, period) {
      return repos.executiveBriefings.findLatest(orgId, businessId, period);
    },

    async list(orgId, businessId, limit) {
      return repos.executiveBriefings.listByBusinessId(orgId, businessId, limit);
    },
  };
}
