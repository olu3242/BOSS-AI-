import type { RepositoryContainer } from "../container.js";

export interface CustomerHealthScore {
  businessId: string;
  orgId: string;
  score: number;
  tier: "champion" | "healthy" | "at_risk" | "critical";
  signals: {
    mriCompleted: boolean;
    workspaceViewedRecently: boolean;
    decisionApproved: boolean;
    activeWorkflows: boolean;
    feedbackSubmitted: boolean;
  };
  computedAt: string;
}

export interface CustomerHealthService {
  computeScore(orgId: string, businessId: string): Promise<CustomerHealthScore>;
  listScores(orgIds: string[]): Promise<CustomerHealthScore[]>;
}

function tierFor(score: number): CustomerHealthScore["tier"] {
  if (score >= 80) return "champion";
  if (score >= 60) return "healthy";
  if (score >= 40) return "at_risk";
  return "critical";
}

export function createCustomerHealthService(repos: RepositoryContainer): CustomerHealthService {
  return {
    async computeScore(orgId, businessId) {
      const cutoffWeek = new Date(Date.now() - 7 * 86_400_000).toISOString();

      const [mriEvents, workspaceEvents, approvalEvents, feedbackEvents, workflowEvents] = await Promise.all([
        repos.eventLog.listByType("analytics.mri.completed", 500),
        repos.eventLog.listByType("analytics.workspace.viewed", 500),
        repos.eventLog.listByType("analytics.recommendation.accepted", 500),
        repos.eventLog.listByType("analytics.feedback.submitted", 500),
        repos.eventLog.listByType("analytics.workflow.executed", 500),
      ]);

      const forBusiness = (events: Array<{ payload: unknown; occurredAt: string }>) =>
        events.filter((e) => {
          const p = e.payload as Record<string, unknown>;
          return p["orgId"] === orgId && p["businessId"] === businessId;
        });

      const mriCompleted = forBusiness(mriEvents).length > 0;
      const workspaceViewedRecently = forBusiness(workspaceEvents).some((e) => e.occurredAt >= cutoffWeek);
      const decisionApproved = forBusiness(approvalEvents).length > 0;
      const hasActiveWorkflows = forBusiness(workflowEvents).length > 0;
      const feedbackSubmitted = forBusiness(feedbackEvents).length > 0;

      let score = 0;
      if (mriCompleted) score += 20;
      if (workspaceViewedRecently) score += 20;
      if (decisionApproved) score += 25;
      if (hasActiveWorkflows) score += 20;
      if (feedbackSubmitted) score += 15;

      return {
        businessId,
        orgId,
        score,
        tier: tierFor(score),
        signals: {
          mriCompleted,
          workspaceViewedRecently,
          decisionApproved,
          activeWorkflows: hasActiveWorkflows,
          feedbackSubmitted,
        },
        computedAt: new Date().toISOString(),
      };
    },

    async listScores(orgIds) {
      const createdEvents = await repos.eventLog.listByType("analytics.business.created", 5000);
      const pairs = createdEvents
        .map((e) => {
          const p = e.payload as Record<string, unknown>;
          return { orgId: p["orgId"] as string, businessId: p["businessId"] as string };
        })
        .filter(({ orgId, businessId }) => orgId && businessId && (orgIds.length === 0 || orgIds.includes(orgId)));

      const unique = [...new Map(pairs.map((p) => [`${p.orgId}:${p.businessId}`, p])).values()];
      return Promise.all(unique.map(({ orgId, businessId }) => this.computeScore(orgId, businessId)));
    },
  };
}
