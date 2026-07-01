import type { AgentRuntime } from "./agentRuntime.js";
import type { InMemoryQueueRuntime, QueueHandler } from "./queueRuntime.js";
import type { InMemorySchedulerRuntime } from "./schedulerRuntime.js";
import type {
  RuntimeHealth,
  RuntimeLifecycleState,
} from "./runtimeTypes.js";
import type { RuntimeTelemetry } from "./telemetry.js";
import type { WorkflowRuntime } from "./workflowRuntime.js";

export class BossRuntime {
  private lifecycleState: RuntimeLifecycleState = "stopped";
  private startedAt: string | null = null;
  private readonly handlers = new Map<string, QueueHandler>();

  constructor(
    readonly workflows: WorkflowRuntime,
    readonly agents: AgentRuntime,
    readonly queue: InMemoryQueueRuntime,
    readonly scheduler: InMemorySchedulerRuntime,
    private readonly telemetry: RuntimeTelemetry,
  ) {}

  start(agentIds: readonly string[] = []): RuntimeHealth {
    if (this.lifecycleState !== "stopped") {
      return this.health();
    }
    this.lifecycleState = "starting";
    for (const agentId of agentIds) {
      this.agents.activate(agentId);
    }
    this.startedAt = new Date().toISOString();
    this.lifecycleState = "running";
    return this.health();
  }

  registerQueueHandler(name: string, handler: QueueHandler): void {
    if (this.handlers.has(name)) {
      throw new Error(`Queue handler "${name}" is already registered.`);
    }
    this.handlers.set(name, handler);
  }

  async tick(now = new Date()): Promise<RuntimeHealth> {
    if (this.lifecycleState !== "running") {
      throw new Error("The BOSS runtime is not running.");
    }
    this.scheduler.runDue(now, this.queue);
    await this.queue.runUntilIdle(Object.fromEntries(this.handlers));
    return this.health();
  }

  shutdown(): RuntimeHealth {
    this.lifecycleState = "stopping";
    this.lifecycleState = "stopped";
    this.startedAt = null;
    return this.health();
  }

  health(): RuntimeHealth {
    return Object.freeze({
      state: this.lifecycleState,
      startedAt: this.startedAt,
      checkedAt: new Date().toISOString(),
      queueDepth: this.queue.pending().length,
      deadLetterCount: this.queue.deadLetters().length,
      activeAgentExecutions: this.agents.activeExecutionCount(),
      activeWorkflowExecutions: this.workflows.activeCount(),
    });
  }

  recordHealth(context: Parameters<RuntimeTelemetry["metric"]>[3]): RuntimeHealth {
    const health = this.health();
    this.telemetry.metric("runtime.queue_depth", health.queueDepth, "count", context);
    this.telemetry.metric(
      "runtime.dead_letter_count",
      health.deadLetterCount,
      "count",
      context,
    );
    return health;
  }
}
