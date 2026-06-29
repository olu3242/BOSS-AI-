import type { EventBus } from "@boss/events";
import { nowIso } from "@boss/shared";
import type { WorkflowExecution } from "@boss/types";
import type { LoopRuntimePorts, StepSpec } from "./ports.js";
import type { TaskHandlerRegistry } from "./taskHandlerRegistry.js";
import { assertTransition } from "./stateMachine.js";

const DEFAULT_MAX_RETRIES = 0;

export interface LoopRuntime {
  execute(orgId: string, businessId: string, workflowKey: string, steps: StepSpec[]): Promise<WorkflowExecution>;
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
        const step = steps[stepIndex];
        if (!step) {
          continue;
        }

        const stepResult = await runStep(ports, handlers, eventBus, orgId, businessId, execution.id, step);

        if (!stepResult.success) {
          await rollbackCompletedSteps(ports, handlers, eventBus, orgId, businessId, execution.id, steps, stepIndex);

          execution = await ports.workflowExecutions.updateState(
            orgId,
            execution.id,
            "failed",
            stepIndex,
            { completedSteps: completedStepOutputs },
            stepResult.errorMessage,
            nowIso()
          );
          await emit(ports, eventBus, orgId, businessId, execution.id, "execution.failed", {
            workflowKey,
            stepKey: step.stepKey,
            errorMessage: stepResult.errorMessage,
          });
          return execution;
        }

        completedStepOutputs.push(stepResult.output ?? {});
        execution = await ports.workflowExecutions.updateState(
          orgId,
          execution.id,
          "running",
          stepIndex + 1,
          null,
          null,
          null
        );
      }

      execution = await ports.workflowExecutions.updateState(
        orgId,
        execution.id,
        "completed",
        steps.length,
        { completedSteps: completedStepOutputs },
        null,
        nowIso()
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
    const result = await handler(step.input);

    if (!result.errorMessage) {
      task = await ports.taskExecutions.updateState(orgId, task.id, "completed", attempt, result.output, null, nowIso());
      await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.completed", {
        stepKey: step.stepKey,
        attempt,
      });
      return { success: true, output: result.output, errorMessage: null };
    }

    lastError = result.errorMessage;
    attempt += 1;

    if (attempt <= maxRetries) {
      task = await ports.taskExecutions.updateState(orgId, task.id, "running", attempt, null, lastError, null);
      await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.retrying", {
        stepKey: step.stepKey,
        attempt,
        errorMessage: lastError,
      });
    }
  }

  task = await ports.taskExecutions.updateState(orgId, task.id, "failed", attempt, null, lastError, nowIso());
  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "task.failed", {
    stepKey: step.stepKey,
    errorMessage: lastError,
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
  steps: StepSpec[],
  failedStepIndex: number
): Promise<void> {
  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "rollback.started", {
    failedStepIndex,
  });

  for (let i = failedStepIndex - 1; i >= 0; i -= 1) {
    const step = steps[i];
    if (!step?.compensationTaskType) {
      continue;
    }
    const handler = handlers.resolve(step.compensationTaskType);
    await handler(step.input);
  }

  await emit(ports, eventBus, orgId, businessId, workflowExecutionId, "rollback.completed", {
    failedStepIndex,
  });
}
