import { randomUUID } from "node:crypto";
import type { ExecutionContext } from "./runtimeTypes.js";
import type { RuntimeTelemetry } from "./telemetry.js";

export type QueueJobState =
  | "pending"
  | "running"
  | "completed"
  | "dead_letter";

export interface QueueJob<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly payload: TPayload;
  readonly context: ExecutionContext;
  readonly attempts: number;
  readonly maximumAttempts: number;
  readonly state: QueueJobState;
  readonly error: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type QueueHandler<TPayload = unknown> = (
  job: QueueJob<TPayload>,
) => Promise<void>;

export class InMemoryQueueRuntime {
  private readonly jobs = new Map<string, QueueJob>();

  constructor(private readonly telemetry: RuntimeTelemetry) {}

  enqueue<TPayload>(
    name: string,
    payload: TPayload,
    context: ExecutionContext,
    maximumAttempts = 3,
  ): QueueJob<TPayload> {
    const now = new Date().toISOString();
    const job: QueueJob<TPayload> = Object.freeze({
      id: randomUUID(),
      name,
      payload,
      context,
      attempts: 0,
      maximumAttempts: Math.max(1, maximumAttempts),
      state: "pending",
      error: null,
      createdAt: now,
      updatedAt: now,
    });
    this.jobs.set(job.id, job);
    this.telemetry.metric("queue.enqueued", 1, "count", context, { queue: name });
    return job;
  }

  async runUntilIdle(
    handlers: Readonly<Record<string, QueueHandler>>,
  ): Promise<void> {
    while (this.pending().length > 0) {
      const pending = this.pending();
      for (const job of pending) {
        await this.process(job, handlers[job.name]);
      }
    }
  }

  replay(id: string): QueueJob {
    const job = this.jobs.get(id);
    if (!job || job.state !== "dead_letter") {
      throw new Error(`Dead-letter job "${id}" was not found.`);
    }
    const replayed: QueueJob = Object.freeze({
      ...job,
      attempts: 0,
      state: "pending",
      error: null,
      updatedAt: new Date().toISOString(),
    });
    this.jobs.set(id, replayed);
    this.telemetry.metric("queue.replayed", 1, "count", job.context, {
      queue: job.name,
    });
    return replayed;
  }

  pending(): readonly QueueJob[] {
    return Object.freeze(
      Array.from(this.jobs.values()).filter((job) => job.state === "pending"),
    );
  }

  deadLetters(): readonly QueueJob[] {
    return Object.freeze(
      Array.from(this.jobs.values()).filter(
        (job) => job.state === "dead_letter",
      ),
    );
  }

  list(): readonly QueueJob[] {
    return Object.freeze(Array.from(this.jobs.values()));
  }

  private async process(
    job: QueueJob,
    handler: QueueHandler | undefined,
  ): Promise<void> {
    const attempts = job.attempts + 1;
    this.jobs.set(
      job.id,
      Object.freeze({
        ...job,
        attempts,
        state: "running",
        updatedAt: new Date().toISOString(),
      }),
    );

    try {
      if (!handler) {
        throw new Error(`No queue handler is registered for "${job.name}".`);
      }
      await handler(job);
      this.jobs.set(
        job.id,
        Object.freeze({
          ...job,
          attempts,
          state: "completed",
          error: null,
          updatedAt: new Date().toISOString(),
        }),
      );
      this.telemetry.metric("queue.completed", 1, "count", job.context, {
        queue: job.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const state: QueueJobState =
        attempts >= job.maximumAttempts ? "dead_letter" : "pending";
      this.jobs.set(
        job.id,
        Object.freeze({
          ...job,
          attempts,
          state,
          error: message,
          updatedAt: new Date().toISOString(),
        }),
      );
      this.telemetry.metric(
        state === "dead_letter" ? "queue.dead_lettered" : "queue.retry",
        1,
        "count",
        job.context,
        { queue: job.name },
      );
    }
  }
}
