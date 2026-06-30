import type { BossEvent, EventBus } from "./eventBus.js";

export interface EventLogSink {
  append(entry: {
    type: string;
    payload: Record<string, unknown>;
    occurredAt: string;
    orgId: string | null;
    correlationId: string | null;
    causationId: string | null;
  }): Promise<unknown>;
}

/**
 * Wraps any EventBus and writes every published event to a persistent
 * EventLogSink before dispatching to in-process subscribers.
 * The sink write is fire-and-forget on failure — a sink error never
 * silences the in-process subscribers.
 */
export function createDurableEventBus(inner: EventBus, sink: EventLogSink): EventBus {
  return {
    async publish<TPayload>(event: BossEvent<TPayload>): Promise<void> {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      const orgId = (payload.orgId as string | undefined) ?? null;
      sink
        .append({ type: event.type, payload, occurredAt: event.occurredAt, orgId, correlationId: null, causationId: null })
        .catch(() => undefined);
      await inner.publish(event);
    },
    subscribe<TPayload>(type: string, handler: (event: BossEvent<TPayload>) => void): void {
      inner.subscribe(type, handler);
    },
  };
}
