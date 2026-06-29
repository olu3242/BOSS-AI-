export interface BossEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
  occurredAt: string;
}

export interface EventBus {
  publish<TPayload>(event: BossEvent<TPayload>): Promise<void>;
  subscribe<TPayload>(type: string, handler: (event: BossEvent<TPayload>) => void): void;
}
