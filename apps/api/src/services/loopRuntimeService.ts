import { createLoopRuntime, createTaskHandlerRegistry, type LoopRuntime, type StepEntry } from "@boss/loop";
import { decideAiEmployeeAction } from "@boss/mcp";
import { nowIso } from "@boss/shared";
import type { WorkflowExecution } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { ToolFabricService } from "./toolFabricService.js";

export interface LoopRuntimeService {
  execute(orgId: string, businessId: string, workflowKey: string, steps: StepEntry[]): Promise<WorkflowExecution>;
}

function notImplementedHandler(taskType: string) {
  return async () => ({
    output: null,
    errorMessage: `No handler implemented yet for task type "${taskType}"`,
  });
}

export function createLoopRuntimeService(
  repos: RepositoryContainer,
  toolFabric: ToolFabricService
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

    try {
      const execution = await toolFabric.requestTool(orgId, businessId, {
        capabilityKey,
        roleKey,
        requestedBy,
        input: rest,
      });

      return { output: execution.output, errorMessage: execution.errorMessage };
    } catch (error) {
      return { output: null, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  });

  handlers.register("ai", async (input) => {
    const { orgId, businessId, employeeKey, capabilityKey, requestedBy, ...rest } = input as {
      orgId: string;
      businessId: string;
      employeeKey: string;
      capabilityKey: string;
      requestedBy: string;
    } & Record<string, unknown>;

    try {
      const decision = decideAiEmployeeAction({ employeeKey, capabilityKey, requestedBy, input: rest });

      if (decision.kind === "escalate") {
        await repos.eventBus.publish({
          type: "ai_employee.escalation.triggered",
          payload: { orgId, businessId, employeeKey, capabilityKey, reason: decision.reason },
          occurredAt: nowIso(),
        });
        return { output: null, errorMessage: decision.reason };
      }

      const execution = await toolFabric.requestTool(orgId, businessId, decision.toolRequest);

      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "agent",
        ownerId: employeeKey,
        key: `last_execution:${capabilityKey}`,
        value: { toolExecutionId: execution.id, status: execution.status, occurredAt: nowIso() },
        expiresAt: null,
      });

      await repos.eventBus.publish({
        type: execution.errorMessage ? "ai_employee.task.failed" : "ai_employee.task.completed",
        payload: { orgId, businessId, employeeKey, capabilityKey, toolExecutionId: execution.id },
        occurredAt: nowIso(),
      });

      return { output: execution.output, errorMessage: execution.errorMessage };
    } catch (error) {
      return { output: null, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  });

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
    repos.eventBus
  );

  return {
    execute(orgId, businessId, workflowKey, steps) {
      return runtime.execute(orgId, businessId, workflowKey, steps);
    },
  };
}
