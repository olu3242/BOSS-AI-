import type { EventContext } from "@boss/events";

export type ExecutionContext = EventContext;

export interface ExecutionContextGuard {
  assertReady(
    businessId: string,
    context: ExecutionContext,
  ): Promise<void>;
}

export class UnconfiguredExecutionContextGuard
  implements ExecutionContextGuard
{
  async assertReady(): Promise<void> {
    throw new Error(
      "Execution requires a configured canonical Business Context guard.",
    );
  }
}

export type RuntimeLifecycleState =
  | "stopped"
  | "starting"
  | "running"
  | "degraded"
  | "stopping";

export interface RuntimeHealth {
  readonly state: RuntimeLifecycleState;
  readonly startedAt: string | null;
  readonly checkedAt: string;
  readonly queueDepth: number;
  readonly deadLetterCount: number;
  readonly activeAgentExecutions: number;
  readonly activeWorkflowExecutions: number;
}

export interface RuntimeLog {
  readonly level: "info" | "warn" | "error";
  readonly message: string;
  readonly context: ExecutionContext;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
}

export interface RuntimeMetric {
  readonly name: string;
  readonly value: number;
  readonly unit: "count" | "milliseconds";
  readonly context: ExecutionContext;
  readonly tags: Readonly<Record<string, string>>;
  readonly occurredAt: string;
}
