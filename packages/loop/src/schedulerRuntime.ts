import { randomUUID } from "node:crypto";
import type { ExecutionContext } from "./runtimeTypes.js";
import type { InMemoryQueueRuntime, QueueJob } from "./queueRuntime.js";

export interface ScheduledJob<TPayload = unknown> {
  readonly id: string;
  readonly queueName: string;
  readonly payload: TPayload;
  readonly context: ExecutionContext;
  readonly runAt: string;
  readonly recurrenceMs: number | null;
  readonly maximumAttempts: number;
}

export class InMemorySchedulerRuntime {
  private readonly schedules = new Map<string, ScheduledJob>();

  schedule<TPayload>(
    queueName: string,
    payload: TPayload,
    context: ExecutionContext,
    runAt: Date,
    options: { recurrenceMs?: number; maximumAttempts?: number } = {},
  ): ScheduledJob<TPayload> {
    const scheduled: ScheduledJob<TPayload> = Object.freeze({
      id: randomUUID(),
      queueName,
      payload,
      context,
      runAt: runAt.toISOString(),
      recurrenceMs: options.recurrenceMs ?? null,
      maximumAttempts: options.maximumAttempts ?? 3,
    });
    this.schedules.set(scheduled.id, scheduled);
    return scheduled;
  }

  runDue(now: Date, queue: InMemoryQueueRuntime): readonly QueueJob[] {
    const enqueued: QueueJob[] = [];
    for (const scheduled of this.schedules.values()) {
      if (Date.parse(scheduled.runAt) > now.getTime()) {
        continue;
      }
      enqueued.push(
        queue.enqueue(
          scheduled.queueName,
          scheduled.payload,
          scheduled.context,
          scheduled.maximumAttempts,
        ),
      );
      if (scheduled.recurrenceMs === null) {
        this.schedules.delete(scheduled.id);
      } else {
        this.schedules.set(
          scheduled.id,
          Object.freeze({
            ...scheduled,
            runAt: new Date(
              Date.parse(scheduled.runAt) + scheduled.recurrenceMs,
            ).toISOString(),
          }),
        );
      }
    }
    return Object.freeze(enqueued);
  }

  list(): readonly ScheduledJob[] {
    return Object.freeze(Array.from(this.schedules.values()));
  }
}
