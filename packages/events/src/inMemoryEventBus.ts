import type { BossEvent, EventBus } from "./eventBus.js";

export function createInMemoryEventBus(): EventBus {
  const handlers = new Map<string, Array<(event: BossEvent<unknown>) => void>>();

  return {
    async publish<TPayload>(event: BossEvent<TPayload>): Promise<void> {
      const subscribers = handlers.get(event.type) ?? [];
      for (const handler of subscribers) {
        handler(event as BossEvent<unknown>);
      }
    },
    subscribe<TPayload>(type: string, handler: (event: BossEvent<TPayload>) => void): void {
      const existing = handlers.get(type) ?? [];
      existing.push(handler as (event: BossEvent<unknown>) => void);
      handlers.set(type, existing);
    },
  };
}
