/**
 * createLoopRuntime — low-level step execution engine.
 * @layer    execution (sequential + parallel steps, TaskHandlerRegistry, compensation)
 * @relation WorkflowRuntime (workflowRuntime.ts) is the orchestration layer above this.
 *           loopRuntimeService in apps/api uses this directly for handler wiring.
 *           Do not use this directly in new automations — use WorkflowRuntime instead.
 * @owner    @boss/loop
 */
import type { EventBus } from "@boss/events";
import { nowIso } from "@boss/shared";
import type { WorkflowExecution } from "@boss/types";
import type { LoopRuntimePorts, StepEntry, StepSpec } from "./ports.js";
import { isParallelGroup } from "./ports.js";
import type { TaskHandlerRegistry } from "./taskHandlerRegistry.js";
import { assertTransition } from "./stateMachine.js";

const DEFAULT_MAX_RETRIES = 0;

export interface LoopRuntime {
  execute(orgId: string, businessId: string, workflowKey: string, steps: StepEntry[]): Promise<WorkflowExecution>;
}

async function emit(
  ports: LoopRuntimePorts,
  eventBus: EventBus,
  orgId: string,
  businessId: string,
  workflowExecutionId: string,
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  const occurredAt = nowIso();
  await ports.executionEvents.append({ orgId, businessId, workflowExecutionId, type, payload, occurredAt });
  await eventBus.publish({ type, payload: { ...payload, orgId, businessId, workflowExecutionId }, occurredAt });
}

export function createLoopRuntime(ports: LoopRuntimePorts, handlers: TaskHandlerRegistry, eventBus: EventBus): LoopRuntime {
  return {
    async execute(orgId, businessId, workflowKey, steps) {
      let execution = await ports.workflowExecutions.create({
        orgId,
        businessId,
        workflowKey,
        state: "pending",
        currentStepIndex: 0,
        input: { stepCount: steps.length },
        output: null,
        errorMessage: null,
        startedAt: nowIso(),
        completedAt: null,
      });

      await emit(ports, eventBus, orgId, businessId, execution.id, "execution.created", { workflowKey });

      assertTransition(execution.state, "queued");
      execution = await ports.workflowExecutions.updateState(orgId, execution.id, "queued", 0, null, null, null);
      assertTransition(execution.state, "running");
      execution = await ports.workflowExecutions.updateState(orgId, execution.id, "running", 0, null, null, null);
      await emit(ports, eventBus, orgId, businessId, execution.id, "execution.started", { workflowKey });

      const completedStepOutputs: Record<string, unknown>[] = [];

      for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
        const entry = steps[stepIndex];
        if (!entry) continue;

        if (isParallelGroup(entry)) {
          // Fan-out: run all steps in the group concurrently
          await emit(ports, eventBus, orgId, businessId, execution.id, "parallel.group.started", {
            groupKey: entry.groupKey,
            stepCount: entry.steps.length,
          });

          const groupResults = await Promise.all(
            entry.steps.map((step) =>
              runStep(ports, handlers, eventBus, orgId, businessId, execution.id, step)
            )
          );

          const firstFailure = groupResults.find((r) => !r.success);
          if (firstFailure) {
            // Roll back sequential steps already completed before this group
            await rollbackCompletedSteps(ports, handlers, eventBus, orgId, businessId, execution.id, steps, stepIndex);
            execution = await ports.workflowExecutions.updateState(
              orgId, execution.id, "failed", stepIndex,
              { completedSteps: completedStepOutputs }, firstFailure.errorMessage, nowIso()
            );
            await emit(ports, eventBus, orgId, businessId, execution.id, "execution.failed", {
              workflowKey, groupKey: entry.groupKey, errorMessage: firstFailure.errorMessage,
            });
            return execution;
          }

          for (const r of groupResults) {
            completedStepOutputs.push(r.output ?? {});
          }

          await emit(ports, eventBus, orgId, businessId, execution.id, "parallel.group.completed", {
            groupKey: entry.groupKey,
          });
        } else {
          // Sequential step
          const stepResult = await runStep(ports, handlers, eventBus, orgId, businessId, execution.id, entry);

          if (!stepResult.success) {
            await rollbackCompletedSteps(ports, handlers, eventBus, orgId, businessId, execution.id, steps, stepIndex);
            execution = await ports.workflowExecutions.updateState(
              orgId, execution.id, "failed", stepIndex,
              { completedSteps: completedStepOutputs }, stepResult.errorMessage, nowIso()
            );
            await emit(ports, eventBus, orgId, businessId, execution.id, "execution.failed", {
              workflowKey, stepKey: entry.stepKey, errorMessage: stepResult.errorMessage,
            });
            return execution;
          }

          completedStepOutputs.push(stepResult.output ?? {});
        }

        execution = await ports.workflowExecutions.updateState(
          orgId, execution.id, "running", stepIndex + 1, null, null, null
        );
      }

      execution = await ports.workflowExecutions.updateState(
        orgId, execution.id, "completed", steps.length,
        { completedSteps: completedStepOutputs }, null, nowIso()
      );
      await emit(ports, eventBus, orgId, businessId, execution.id, "execution.completed", { workflowKey });

      return execution;
    },
  };
}

interface StepRunResult {
  success: boolean;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
}

async function runStep(
  ports: LoopRuntimePorts,
  handlers: TaskHandlerRegistry,
  eventBus: EventBus,
  orgId: string,
  businessId: string,
  workflowExecutionId: string,
  step: StepSpec
): Promise<StepRunResult> {
  const maxRetries = step.maxRetries ?? DEFAULT_MAX_RETRIES;

  let task = await ports.taskExecutions.create({
    orgId,
    businessId,
    workflowExecutionId,
    stepKey: step.stepKey,
    taskType: step.taskType,
    state: "running",
    attempt: 0,
    maxRetries,
    input: step.input,
    output: null,
    errorMessage: null,
    startedAt: nowIso(),
    completedAt: null,
  });

  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.created", { stepKey: step.stepKey });
  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.started", { stepKey: step.stepKey });

  const handler = handlers.resolve(step.taskType);
  let attempt = 0;
  let lastError: string | null = null;

  while (attempt <= maxRetries) {
    let result: { output: Record<string, unknown> | null; errorMessage: string | null };

    if (step.timeoutMs != null) {
      const timeoutMs = step.timeoutMs;
      const timeoutPromise = new Promise<{ output: null; errorMessage: string }>((resolve) => {
        setTimeout(() => resolve({ output: null, errorMessage: `Task "${step.stepKey}" timed out after ${timeoutMs}ms` }), timeoutMs);
      });
      result = await Promise.race([handler(step.input), timeoutPromise]);
    } else {
      result = await handler(step.input);
    }

    if (!result.errorMessage) {
      task = await ports.taskExecutions.updateState(orgId, task.id, "completed", attempt, result.output, null, nowIso());
      await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.completed", {
        stepKey: step.stepKey, attempt,
      });
      return { success: true, output: result.output, errorMessage: null };
    }

    lastError = result.errorMessage;

    // Transition to timed_out state if message indicates a timeout
    if (lastError.includes("timed out")) {
      task = await ports.taskExecutions.updateState(orgId, task.id, "timed_out", attempt, null, lastError, nowIso());
      await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.timed_out", {
        stepKey: step.stepKey, attempt,
      });
      await ports.deadLetters.add({
        orgId, businessId, workflowExecutionId, taskExecutionId: task.id,
        stepKey: step.stepKey, reason: lastError, payload: step.input,
      });
      return { success: false, output: null, errorMessage: lastError };
    }

    attempt += 1;

    if (attempt <= maxRetries) {
      task = await ports.taskExecutions.updateState(orgId, task.id, "running", attempt, null, lastError, null);
      await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.retrying", {
        stepKey: step.stepKey, attempt, errorMessage: lastError,
      });
    }
  }

  task = await ports.taskExecutions.updateState(orgId, task.id, "failed", attempt, null, lastError, nowIso());
  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.failed", {
    stepKey: step.stepKey, errorMessage: lastError,
  });

  await ports.deadLetters.add({
    orgId,
    businessId,
    workflowExecutionId,
    taskExecutionId: task.id,
    stepKey: step.stepKey,
    reason: lastError ?? "Unknown failure",
    payload: step.input,
  });

  return { success: false, output: null, errorMessage: lastError };
}

async function rollbackCompletedSteps(
  ports: LoopRuntimePorts,
  handlers: TaskHandlerRegistry,
  eventBus: EventBus,
  orgId: string,
  businessId: string,
  workflowExecutionId: string,
  steps: StepEntry[],
  failedStepIndex: number
): Promise<void> {
  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "rollback.started", {
    failedStepIndex,
  });

  for (let i = failedStepIndex - 1; i >= 0; i -= 1) {
    const entry = steps[i];
    if (!entry) continue;
    if (isParallelGroup(entry)) {
      // Roll back all steps in the group
      await Promise.all(
        entry.steps
          .filter((s) => s.compensationTaskType)
          .map((s) => handlers.resolve(s.compensationTaskType!)(s.input))
      );
    } else if (entry.compensationTaskType) {
      const handler = handlers.resolve(entry.compensationTaskType);
      await handler(entry.input);
    }
  }

  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "rollback.completed", {
    failedStepIndex,
  });
}
