import type {
  BusinessTimelineEntry,
  DeadLetterEntry,
  ExecutionEventRecord,
  TaskExecution,
  WorkflowExecution,
} from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface WorkflowExecutionSummary extends WorkflowExecution {
  tasks: TaskExecution[];
  events: ExecutionEventRecord[];
}

export interface MissionControlSnapshot {
  workflows: WorkflowExecutionSummary[];
  deadLetters: DeadLetterEntry[];
  timeline: BusinessTimelineEntry[];
}

export interface MissionControlService {
  getSnapshot(orgId: string, businessId: string): Promise<MissionControlSnapshot>;
}

/**
 * Read-only projection over execution evidence already persisted by the
 * Loop Runtime, Tool Fabric, and business services. Mission Control owns
 * no state of its own — it never writes, only assembles a snapshot from
 * existing durable repositories.
 */
export function createMissionControlService(repos: RepositoryContainer): MissionControlService {
  return {
    async getSnapshot(orgId, businessId) {
      const workflows = await repos.workflowExecutions.listByBusinessId(orgId, businessId);

      const workflowSummaries = await Promise.all(
        workflows.map(async (workflow): Promise<WorkflowExecutionSummary> => {
          const [tasks, events] = await Promise.all([
            repos.taskExecutions.listByWorkflowExecutionId(orgId, workflow.id),
            repos.executionEvents.listByWorkflowExecutionId(orgId, workflow.id),
          ]);
          return { ...workflow, tasks, events };
        })
      );

      const [deadLetters, timeline] = await Promise.all([
        repos.deadLetters.listByBusinessId(orgId, businessId),
        repos.businessTimeline.listByBusinessId(orgId, businessId),
      ]);

      return { workflows: workflowSummaries, deadLetters, timeline };
    },
  };
}
