import {
  planMultiAgentTask,
  reflectOnOutcomes,
  type AgentPlan,
  type AgentStepOutcome,
  type PlanningContext,
  type ReflectionResult,
} from "@boss/mcp";
import { type ParallelStepGroup, type StepEntry, type StepSpec } from "@boss/loop";
import { nowIso } from "@boss/shared";
import type { WorkflowExecution } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { LoopRuntimeService } from "./loopRuntimeService.js";

export interface MultiAgentOutcome {
  workflowExecution: WorkflowExecution;
  plan: AgentPlan;
  outcomes: AgentStepOutcome[];
  reflection: ReflectionResult | null;
}

export interface MultiAgentRuntimeService {
  /**
   * Plan, delegate, execute, and reflect on a multi-agent task.
   * - MCP plans which employees handle which capabilities (intelligence)
   * - Loop executes the steps, including parallel groups (execution)
   * - MCP reflects on outcomes (intelligence)
   */
  delegateTask(
    orgId: string,
    businessId: string,
    ctx: PlanningContext,
    employeeKeys: string[]
  ): Promise<MultiAgentOutcome>;
}

export function createMultiAgentRuntimeService(
  repos: RepositoryContainer,
  loopRuntime: LoopRuntimeService
): MultiAgentRuntimeService {
  return {
    async delegateTask(orgId, businessId, ctx, employeeKeys) {
      // 1. Plan (MCP intelligence — no execution)
      const plan = planMultiAgentTask(ctx, employeeKeys);

      await repos.eventBus.publish({
        type: "multi_agent.plan.created",
        payload: { orgId, businessId, planId: plan.planId, goal: plan.goal, stepCount: plan.steps.length },
        occurredAt: nowIso(),
      });

      // 2. Build StepEntry[] from plan — group parallel steps together
      const steps = buildStepEntries(plan, orgId, businessId);

      // 3. Execute through Loop Runtime (execution — no intelligence)
      const workflowExecution = await loopRuntime.execute(
        orgId,
        businessId,
        `multi_agent.${plan.planId}`,
        steps
      );

      await repos.eventBus.publish({
        type: "multi_agent.execution.completed",
        payload: { orgId, businessId, planId: plan.planId, state: workflowExecution.state },
        occurredAt: nowIso(),
      });

      // 4. Collect outcomes from task executions
      const taskExecutions = await repos.taskExecutions.listByWorkflowExecutionId(orgId, workflowExecution.id);

      const outcomes: AgentStepOutcome[] = plan.steps.map((planStep) => {
        const task = taskExecutions.find((t) => t.stepKey === planStep.stepKey);
        return {
          stepKey: planStep.stepKey,
          employeeKey: planStep.employeeKey,
          capabilityKey: planStep.capabilityKey,
          succeeded: task?.state === "completed",
          output: (task?.output ?? null) as Record<string, unknown> | null,
          errorMessage: task?.errorMessage ?? null,
        };
      });

      // 5. Reflect on outcomes (MCP intelligence — no execution)
      const reflection = plan.reflectionRequired ? reflectOnOutcomes(plan, outcomes) : null;

      if (reflection) {
        await repos.eventBus.publish({
          type: "multi_agent.reflection.completed",
          payload: {
            orgId, businessId, planId: plan.planId,
            achieved: reflection.achieved, successRate: reflection.successRate,
          },
          occurredAt: nowIso(),
        });
      }

      return { workflowExecution, plan, outcomes, reflection };
    },
  };
}

function buildStepEntries(plan: AgentPlan, orgId: string, businessId: string): StepEntry[] {
  // Group steps by parallelGroupKey
  const groupKeys = new Set(plan.steps.filter((s) => s.parallel && s.parallelGroupKey).map((s) => s.parallelGroupKey!));
  const usedStepKeys = new Set<string>();

  const entries: StepEntry[] = [];

  for (const step of plan.steps) {
    if (usedStepKeys.has(step.stepKey)) continue;

    if (step.parallel && step.parallelGroupKey && groupKeys.has(step.parallelGroupKey)) {
      const groupSteps = plan.steps.filter((s) => s.parallelGroupKey === step.parallelGroupKey);
      const parallelGroup: ParallelStepGroup = {
        groupKey: step.parallelGroupKey,
        parallel: true,
        steps: groupSteps.map((gs): StepSpec => ({
          stepKey: gs.stepKey,
          taskType: "ai",
          input: {
            orgId,
            businessId,
            employeeKey: gs.employeeKey,
            capabilityKey: gs.capabilityKey,
            requestedBy: "multi_agent_runtime",
          },
        })),
      };
      entries.push(parallelGroup);
      for (const gs of groupSteps) usedStepKeys.add(gs.stepKey);
    } else {
      const seqStep: StepSpec = {
        stepKey: step.stepKey,
        taskType: "ai",
        input: {
          orgId,
          businessId,
          employeeKey: step.employeeKey,
          capabilityKey: step.capabilityKey,
          requestedBy: "multi_agent_runtime",
        },
      };
      entries.push(seqStep);
      usedStepKeys.add(step.stepKey);
    }
  }

  return entries;
}
