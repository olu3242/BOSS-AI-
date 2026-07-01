import { deriveKpiReadings, type KpiReading } from "@boss/mcp";
import { workspaceRegistry } from "@boss/registries";
import type { BusinessConstraint, BusinessDecision, BusinessHealth, BusinessRecommendation } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface WorkspaceHealthSummary {
  overallScore: number;
  generatedAt: string;
}

export interface WorkspaceKpiStrip {
  readings: KpiReading[];
}

export interface WorkspaceDecisionsPanel {
  pending: BusinessDecision[];
  approved: BusinessDecision[];
  recentlyCompleted: BusinessDecision[];
}

export interface WorkspaceApprovalQueue {
  pendingDecisions: BusinessDecision[];
  pendingRecommendations: BusinessRecommendation[];
  totalPending: number;
}

export interface WorkspaceLoopStatus {
  lastRunAt: string | null;
  activeConstraints: number;
  activeRecommendations: number;
}

export interface WorkspaceSnapshot {
  businessId: string;
  workspaceKey: string;
  health: WorkspaceHealthSummary | null;
  kpis: WorkspaceKpiStrip;
  decisions: WorkspaceDecisionsPanel;
  approvalQueue: WorkspaceApprovalQueue;
  loopStatus: WorkspaceLoopStatus;
  assembledAt: string;
}

export interface WorkspaceService {
  getWorkspace(orgId: string, businessId: string): Promise<WorkspaceSnapshot>;
  getPendingApprovals(orgId: string, businessId: string): Promise<WorkspaceApprovalQueue>;
}

export function createWorkspaceService(repos: RepositoryContainer): WorkspaceService {
  return {
    async getWorkspace(orgId, businessId) {
      const assembledAt = new Date().toISOString();

      const [health, allDecisions, allRecommendations, allConstraints, eventLog, wfExecutions] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businessDecisions.listByBusinessId(orgId, businessId),
        repos.businessRecommendations.listByBusinessId(orgId, businessId),
        repos.businessConstraints.listByBusinessId(orgId, businessId),
        repos.eventLog.listByOrgId(orgId),
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
      ]);

      const toolExecutionCount = eventLog.filter((e) => e.type === "tool.execution.succeeded").length;
      const workflowCompletionCount = wfExecutions.filter((w) => w.state === "completed").length;

      const kpiReadings = deriveKpiReadings({
        overallHealthScore: health?.overallScore,
        toolExecutionCount,
        workflowCompletionCount,
        measuredAt: assembledAt,
      });

      const loopMemory = await repos.memoryRecords.get(orgId, businessId, "business", businessId, "loop_last_run");

      const activeConstraints = (allConstraints as BusinessConstraint[]).filter(
        (c) => c.status === "active" || c.status === "monitoring"
      ).length;

      const activeRecommendations = (allRecommendations as BusinessRecommendation[]).filter(
        (r) => r.status === "proposed" || r.status === "in_progress"
      ).length;

      const pendingDecisions = allDecisions.filter((d) => d.status === "generated" || d.status === "reviewed");
      const approvedDecisions = allDecisions.filter((d) => d.status === "approved" || d.status === "scheduled");
      const recentlyCompleted = allDecisions
        .filter((d) => d.status === "completed" || d.status === "measured")
        .slice(0, 5);

      const pendingRecommendations = (allRecommendations as BusinessRecommendation[]).filter(
        (r) => r.status === "proposed"
      );

      const workspaceKey = workspaceRegistry.get("executive_workspace")?.key ?? "executive_workspace";

      return {
        businessId,
        workspaceKey,
        health: health
          ? { overallScore: health.overallScore, generatedAt: health.generatedAt }
          : null,
        kpis: { readings: kpiReadings },
        decisions: {
          pending: pendingDecisions,
          approved: approvedDecisions,
          recentlyCompleted,
        },
        approvalQueue: {
          pendingDecisions,
          pendingRecommendations,
          totalPending: pendingDecisions.length + pendingRecommendations.length,
        },
        loopStatus: {
          lastRunAt: loopMemory ? (loopMemory.value as { completedAt?: string })?.completedAt ?? null : null,
          activeConstraints,
          activeRecommendations,
        },
        assembledAt,
      };
    },

    async getPendingApprovals(orgId, businessId) {
      const [allDecisions, allRecommendations] = await Promise.all([
        repos.businessDecisions.listByBusinessId(orgId, businessId),
        repos.businessRecommendations.listByBusinessId(orgId, businessId),
      ]);

      const pendingDecisions = allDecisions.filter((d) => d.status === "generated" || d.status === "reviewed");
      const pendingRecommendations = (allRecommendations as BusinessRecommendation[]).filter(
        (r) => r.status === "proposed"
      );

      return {
        pendingDecisions,
        pendingRecommendations,
        totalPending: pendingDecisions.length + pendingRecommendations.length,
      };
    },
  };
}
