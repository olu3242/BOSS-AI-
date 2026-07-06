import { createLoopRuntime, createTaskHandlerRegistry, CHECKPOINT_SENTINEL, type LoopRuntime, type StepEntry } from "@boss/loop";
import { decideAiEmployeeAction } from "@boss/mcp";
import { nowIso } from "@boss/shared";
import type { WorkflowExecution } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { ToolFabricService } from "./toolFabricService.js";
import { createAiEmployeeExecutionService } from "./aiEmployeeExecutionService.js";
import { createNotificationService } from "./notificationService.js";

export interface LoopRuntimeService {
  execute(orgId: string, businessId: string, workflowKey: string, steps: StepEntry[]): Promise<WorkflowExecution>;
  resume(orgId: string, businessId: string, executionId: string, steps: StepEntry[]): Promise<WorkflowExecution>;
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
  const aiEmployeeExecution = createAiEmployeeExecutionService(repos);

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
      // Pre-flight: policy decision (escalate before inference if policy says so)
      const decision = decideAiEmployeeAction({ employeeKey, capabilityKey, requestedBy, input: rest });

      if (decision.kind === "escalate") {
        await repos.eventBus.publish({
          type: "ai_employee.escalation.triggered",
          payload: { orgId, businessId, employeeKey, capabilityKey, reason: decision.reason },
          occurredAt: nowIso(),
        });
        return { output: null, errorMessage: decision.reason };
      }

      // Full execution pipeline: prompt resolution + memory + LLM inference + escalation eval
      const result = await aiEmployeeExecution.execute({
        orgId,
        businessId,
        employeeKey,
        capabilityKey,
        requestedBy,
        taskInput: rest,
      });

      if (result.escalated) {
        return { output: null, errorMessage: result.escalationReason ?? "Escalated by AI employee" };
      }

      const execution = await toolFabric.requestTool(orgId, businessId, {
        ...decision.toolRequest,
        input: result.enrichedInput,
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

  handlers.register("manual", async (input) => {
    const { orgId, businessId, workflowExecutionId, stepKey, description } = input as {
      orgId: string; businessId?: string; workflowExecutionId?: string; stepKey?: string; description?: string;
    };
    await repos.eventBus.publish({
      type: "workflow.approval.requested",
      payload: {
        orgId,
        businessId: businessId ?? "",
        workflowExecutionId: workflowExecutionId ?? "",
        stepKey: stepKey ?? "",
        description: description ?? "Human approval required",
        requestedAt: nowIso(),
      },
      occurredAt: nowIso(),
    });
    return { output: null, errorMessage: CHECKPOINT_SENTINEL };
  });
  handlers.register("scheduled", notImplementedHandler("scheduled"));

  // ── Notification action handlers ──────────────────────────────────────────
  const notifications = createNotificationService(repos);

  handlers.register("notification.send_sms", async (input) => {
    const { orgId, businessId, recipient, body, templateKey } = input as {
      orgId: string; businessId?: string; recipient: string; body: string; templateKey?: string;
    };
    try {
      const result = await notifications.send({ orgId, businessId, channel: "sms", recipient, body, templateKey });
      return { output: { deliveryId: result.deliveryId, status: result.status }, errorMessage: result.status === "failed" ? result.errorMessage : null };
    } catch (error) {
      return { output: null, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  });

  handlers.register("notification.send_email", async (input) => {
    const { orgId, businessId, recipient, subject, body, templateKey } = input as {
      orgId: string; businessId?: string; recipient: string; subject?: string; body: string; templateKey?: string;
    };
    try {
      const result = await notifications.send({ orgId, businessId, channel: "email", recipient, subject, body, templateKey });
      return { output: { deliveryId: result.deliveryId, status: result.status }, errorMessage: result.status === "failed" ? result.errorMessage : null };
    } catch (error) {
      return { output: null, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  });

  handlers.register("notification.send_internal", async (input) => {
    const { orgId, businessId, recipient, body } = input as {
      orgId: string; businessId?: string; recipient: string; body: string;
    };
    try {
      const result = await notifications.send({ orgId, businessId, channel: "internal", recipient, body });
      return { output: { deliveryId: result.deliveryId, status: result.status }, errorMessage: null };
    } catch (error) {
      return { output: null, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  });

  // ── Audit/measurement handlers ────────────────────────────────────────────
  handlers.register("audit.record", async (input) => {
    const { orgId, businessId, action, actor, resourceType, resourceId } = input as {
      orgId: string; businessId?: string; action: string; actor: string; resourceType: string; resourceId: string;
    };
    await repos.eventBus.publish({
      type: "platform.audit.recorded",
      payload: { orgId, businessId, action, actor, resourceType, resourceId, occurredAt: nowIso() },
      occurredAt: nowIso(),
    });
    return { output: { recorded: true }, errorMessage: null };
  });

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
    resume(orgId, businessId, executionId, steps) {
      return runtime.resume(orgId, businessId, executionId, steps);
    },
  };
}
