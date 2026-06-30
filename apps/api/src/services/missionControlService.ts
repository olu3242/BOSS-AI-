import type {
  BusinessTimelineEntry,
  DeadLetterEntry,
  ExecutionEventRecord,
  TaskExecution,
  WorkflowExecution,
  BusinessDecision,
  BusinessScenario,
} from "@boss/types";
import { deriveKpiReadings, type KpiReading } from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";

export interface WorkflowExecutionSummary extends WorkflowExecution {
  tasks: TaskExecution[];
  events: ExecutionEventRecord[];
}

export interface DecisionQueueSummary {
  pending: BusinessDecision[];
  approved: BusinessDecision[];
  executing: BusinessDecision[];
  completed: BusinessDecision[];
}

export interface MissionControlSnapshot {
  workflows: WorkflowExecutionSummary[];
  deadLetters: DeadLetterEntry[];
  timeline: BusinessTimelineEntry[];
  decisions: DecisionQueueSummary;
  activeScenarios: BusinessScenario[];
  kpiReadings: KpiReading[];
}

export interface MissionControlService {
  getSnapshot(orgId: string, businessId: string): Promise<MissionControlSnapshot>;
}

/**
 * Read-only projection over execution evidence already persisted by the
 * Loop Runtime, Tool Fabric, business services, and the Decision Intelligence
 * layer. Mission Control owns no state — it assembles from existing repositories.
 */
export function createMissionControlService(repos: RepositoryContainer): MissionControlService {
  return {
    async getSnapshot(orgId, businessId) {
      const [workflows, deadLetters, timeline, allDecisions, scenarios, health, events, wfExecutions] = await Promise.all([
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
        repos.deadLetters.listByBusinessId(orgId, businessId),
        repos.businessTimeline.listByBusinessId(orgId, businessId),
        repos.businessDecisions.listByBusinessId(orgId, businessId),
        repos.businessScenarios.listByBusinessId(orgId, businessId),
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.eventLog.listByOrgId(orgId),
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
      ]);

      const workflowSummaries = await Promise.all(
        workflows.map(async (workflow): Promise<WorkflowExecutionSummary> => {
          const [tasks, events] = await Promise.all([
            repos.taskExecutions.listByWorkflowExecutionId(orgId, workflow.id),
            repos.executionEvents.listByWorkflowExecutionId(orgId, workflow.id),
          ]);
          return { ...workflow, tasks, events };
        })
      );

      const decisions: DecisionQueueSummary = {
        pending: allDecisions.filter((d) => d.status === "generated" || d.status === "reviewed"),
        approved: allDecisions.filter((d) => d.status === "approved" || d.status === "scheduled"),
        executing: allDecisions.filter((d) => d.status === "executing"),
        completed: allDecisions.filter((d) => d.status === "completed" || d.status === "measured"),
      };

      const activeScenarios = scenarios.filter((s) => s.status === "calculated" || s.status === "approved");

      const toolExecutionCount = events.filter((e) => e.type === "tool.execution.succeeded").length;
      const workflowCompletionCount = wfExecutions.filter((w) => w.state === "completed").length;
      const kpiReadings = deriveKpiReadings({
        overallHealthScore: health?.overallScore,
        toolExecutionCount,
        workflowCompletionCount,
        measuredAt: new Date().toISOString(),
      });

      return { workflows: workflowSummaries, deadLetters, timeline, decisions, activeScenarios, kpiReadings };
    },
  };
}
