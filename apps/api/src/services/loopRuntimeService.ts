import { createInMemoryEventBus, type EventBus } from "@boss/events";
import { createLoopRuntime, createTaskHandlerRegistry, type LoopRuntime, type StepSpec } from "@boss/loop";
import type { WorkflowExecution } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { ToolFabricService } from "./toolFabricService.js";

export interface LoopRuntimeService {
  execute(orgId: string, businessId: string, workflowKey: string, steps: StepSpec[]): Promise<WorkflowExecution>;
}

function notImplementedHandler(taskType: string) {
  return async () => ({
    output: null,
    errorMessage: `No handler implemented yet for task type "${taskType}"`,
  });
}

export function createLoopRuntimeService(
  repos: RepositoryContainer,
  toolFabric: ToolFabricService,
  eventBus: EventBus = createInMemoryEventBus()
): LoopRuntimeService {
  const handlers = createTaskHandlerRegistry();

  handlers.register("tool", async (input) => {
    const { orgId, businessId, capabilityKey, roleKey, requestedBy, ...rest } = input as {
      orgId: string;
      businessId: string;
      capabilityKey: string;
      roleKey: string;
      requestedBy: string;
    } & Record<string, unknown>;

    const execution = await toolFabric.requestTool(orgId, businessId, {
      capabilityKey,
      roleKey,
      requestedBy,
      input: rest,
    });

    return { output: execution.output, errorMessage: execution.errorMessage };
  });

  handlers.register("ai", notImplementedHandler("ai"));
  handlers.register("manual", notImplementedHandler("manual"));
  handlers.register("scheduled", notImplementedHandler("scheduled"));

  const runtime: LoopRuntime = createLoopRuntime(
    {
      workflowExecutions: repos.workflowExecutions,
      taskExecutions: repos.taskExecutions,
      executionEvents: repos.executionEvents,
      deadLetters: repos.deadLetters,
    },
    handlers,
    eventBus
  );

  return {
    execute(orgId, businessId, workflowKey, steps) {
      return runtime.execute(orgId, businessId, workflowKey, steps);
    },
  };
}
