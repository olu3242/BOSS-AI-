import { randomUUID } from "node:crypto";

export interface EventContext {
  readonly orgId: string;
  readonly businessId?: string;
  readonly actorId: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly traceId: string;
}

export interface BossEvent<TPayload = unknown> {
  readonly id?: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly occurredAt: string;
  readonly context?: EventContext;
}

export interface EventBus {
  publish<TPayload>(event: BossEvent<TPayload>): Promise<void>;
  subscribe<TPayload>(type: string, handler: (event: BossEvent<TPayload>) => void): void;
}

export interface RoutedBossEvent<TPayload = unknown> extends BossEvent<TPayload> {
  readonly id: string;
  readonly context: EventContext;
}

export type EventHandler<TPayload = unknown> = (
  event: RoutedBossEvent<TPayload>,
) => void | Promise<void>;

export interface EventDelivery {
  readonly eventId: string;
  readonly type: string;
  readonly subscriberCount: number;
  readonly success: boolean;
  readonly occurredAt: string;
  readonly error?: string;
}

export interface EventDeliverySink {
  record(delivery: EventDelivery): void;
}

export class InMemoryEventDeliverySink implements EventDeliverySink {
  private readonly deliveries: EventDelivery[] = [];

  record(delivery: EventDelivery): void {
    this.deliveries.push(Object.freeze(delivery));
  }

  list(): readonly EventDelivery[] {
    return Object.freeze([...this.deliveries]);
  }
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(
    private readonly deliverySink: EventDeliverySink = new InMemoryEventDeliverySink(),
  ) {}

  subscribe<TPayload>(
    type: string,
    handler: (event: BossEvent<TPayload>) => void | Promise<void>,
  ): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler as EventHandler);
    this.handlers.set(type, handlers);
  }

  async publish<TPayload>(event: BossEvent<TPayload>): Promise<void> {
    if (!event.context) {
      throw new Error(`Event "${event.type}" is missing tenant and trace context.`);
    }
    const routedEvent: RoutedBossEvent<TPayload> = Object.freeze({
      ...event,
      id: event.id ?? randomUUID(),
      context: event.context,
    });
    const handlers = [
      ...(this.handlers.get(event.type) ?? []),
      ...(this.handlers.get("*") ?? []),
    ];

    try {
      for (const handler of handlers) {
        await handler(routedEvent);
      }
      this.deliverySink.record({
        eventId: routedEvent.id,
        type: routedEvent.type,
        subscriberCount: handlers.length,
        success: true,
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      this.deliverySink.record({
        eventId: routedEvent.id,
        type: routedEvent.type,
        subscriberCount: handlers.length,
        success: false,
        occurredAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export function createBossEvent<TPayload>(
  type: string,
  payload: TPayload,
  context: EventContext,
): RoutedBossEvent<TPayload> {
  return Object.freeze({
    id: randomUUID(),
    type,
    payload,
    occurredAt: new Date().toISOString(),
    context,
  });
}
