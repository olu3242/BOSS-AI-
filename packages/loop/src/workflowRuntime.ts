import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import { workflowRegistry } from "@boss/registries";
import {
  UnconfiguredExecutionContextGuard,
  type ExecutionContext,
  type ExecutionContextGuard,
} from "./runtimeTypes.js";
import type { RuntimeTelemetry } from "./telemetry.js";
import type {
  WorkflowExecutionRecord,
  WorkflowExecutionStore,
} from "./workflowStore.js";

export interface WorkflowStepContext<TInput = unknown> {
  readonly executionId: string;
  readonly businessId: string;
  readonly context: ExecutionContext;
  readonly input: TInput;
  readonly outputs: Readonly<Record<string, unknown>>;
}

export interface ExecutableWorkflowStep<TInput = unknown> {
  readonly id: string;
  readonly kind: "action" | "approval";
  readonly maximumAttempts?: number;
  execute(step: WorkflowStepContext<TInput>): Promise<unknown>;
  approve?(step: WorkflowStepContext<TInput>): Promise<boolean>;
  compensate?(step: WorkflowStepContext<TInput>): Promise<void>;
}

export interface ExecutableWorkflowDefinition<TInput = unknown> {
  readonly id: string;
  readonly steps: readonly ExecutableWorkflowStep<TInput>[];
}

export class WorkflowRuntime {
  private activeExecutions = 0;

  constructor(
    private readonly store: WorkflowExecutionStore,
    private readonly eventBus: EventBus,
    private readonly telemetry: RuntimeTelemetry,
    private readonly definitions: {
      get(id: string): unknown;
    } = workflowRegistry,
    private readonly contextGuard: ExecutionContextGuard =
      new UnconfiguredExecutionContextGuard(),
  ) {}

  activeCount(): number {
    return this.activeExecutions;
  }

  async execute<TInput>(
    definition: ExecutableWorkflowDefinition<TInput>,
    businessId: string,
    input: TInput,
    context: ExecutionContext,
  ): Promise<WorkflowExecutionRecord> {
    if (!this.definitions.get(definition.id)) {
      throw new Error(`Workflow "${definition.id}" is not registered.`);
    }
    await this.contextGuard.assertReady(businessId, context);

    const executionId = randomUUID();
    const startedAt = new Date().toISOString();
    let state: WorkflowExecutionRecord["state"] = "pending";
    let currentStepId: string | null = null;
    let completedStepIds: string[] = [];
    const outputs: Record<string, unknown> = {};
    let error: string | null = null;
    this.activeExecutions += 1;

    const persist = async (
      completedAt: string | null = null,
    ): Promise<WorkflowExecutionRecord> => {
      const record: WorkflowExecutionRecord = {
        id: executionId,
        definitionId: definition.id,
        businessId,
        context,
        state,
        currentStepId,
        completedStepIds: Object.freeze([...completedStepIds]),
        outputs: Object.freeze({ ...outputs }),
        error,
        startedAt,
        updatedAt: new Date().toISOString(),
        completedAt,
      };
      await this.store.save(record);
      return record;
    };

    await persist();
    state = "running";
    await persist();
    await this.eventBus.publish(
      createBossEvent(
        "workflow.started",
        { executionId, definitionId: definition.id, businessId },
        context,
      ),
    );
    const started = performance.now();

    try {
      for (const step of definition.steps) {
        currentStepId = step.id;
        await persist();
        const stepContext: WorkflowStepContext<TInput> = {
          executionId,
          businessId,
          context,
          input,
          outputs: Object.freeze({ ...outputs }),
        };

        if (step.kind === "approval") {
          const approved = await step.approve?.(stepContext);
          if (!approved) {
            state = "awaiting_approval";
            this.telemetry.metric(
              "workflow.awaiting_approval",
              1,
              "count",
              context,
              { workflowId: definition.id, stepId: step.id },
            );
            return await persist();
          }
        }

        const maximumAttempts = Math.max(1, step.maximumAttempts ?? 1);
        let attempt = 0;
        while (attempt < maximumAttempts) {
          attempt += 1;
          try {
            outputs[step.id] = await step.execute(stepContext);
            break;
          } catch (stepError) {
            if (attempt >= maximumAttempts) {
              throw stepError;
            }
            this.telemetry.log("warn", "Workflow step retry scheduled.", context, {
              executionId,
              workflowId: definition.id,
              stepId: step.id,
              attempt,
            });
          }
        }
        completedStepIds = [...completedStepIds, step.id];
      }

      state = "completed";
      currentStepId = null;
      const completedAt = new Date().toISOString();
      const record = await persist(completedAt);
      await this.eventBus.publish(
        createBossEvent(
          "workflow.completed",
          { executionId, definitionId: definition.id, businessId },
          context,
        ),
      );
      this.telemetry.metric(
        "workflow.duration",
        Math.max(0, Math.round(performance.now() - started)),
        "milliseconds",
        context,
        { workflowId: definition.id, state },
      );
      return record;
    } catch (executionError) {
      error =
        executionError instanceof Error
          ? executionError.message
          : String(executionError);
      state = "compensating";
      await persist();

      let compensationFailed = false;
      for (const completedStepId of [...completedStepIds].reverse()) {
        const step = definition.steps.find((candidate) => candidate.id === completedStepId);
        if (step?.compensate) {
          try {
            await step.compensate({
              executionId,
              businessId,
              context,
              input,
              outputs: Object.freeze({ ...outputs }),
            });
          } catch (compensationError) {
            compensationFailed = true;
            this.telemetry.log("error", "Workflow compensation failed.", context, {
              executionId,
              workflowId: definition.id,
              stepId: completedStepId,
              error:
                compensationError instanceof Error
                  ? compensationError.message
                  : String(compensationError),
            });
          }
        }
      }

      state =
        completedStepIds.length > 0 && !compensationFailed
          ? "compensated"
          : "failed";
      currentStepId = null;
      const record = await persist(new Date().toISOString());
      await this.eventBus.publish(
        createBossEvent(
          "workflow.failed",
          { executionId, definitionId: definition.id, businessId, error },
          context,
        ),
      );
      this.telemetry.log("error", "Workflow execution failed.", context, {
        executionId,
        workflowId: definition.id,
        error,
        state,
      });
      return record;
    } finally {
      this.activeExecutions -= 1;
    }
  }
}
