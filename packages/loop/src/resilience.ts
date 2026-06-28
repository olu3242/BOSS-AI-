export interface RetryPolicy {
  readonly maximumAttempts: number;
  readonly initialDelayMilliseconds: number;
  readonly maximumDelayMilliseconds: number;
  readonly multiplier: number;
  readonly jitterRatio: number;
}

export interface RetryDependencies {
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly random?: () => number;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const defaultPolicy: RetryPolicy = Object.freeze({
  maximumAttempts: 3,
  initialDelayMilliseconds: 100,
  maximumDelayMilliseconds: 5_000,
  multiplier: 2,
  jitterRatio: 0.2,
});

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: Partial<RetryPolicy> = {},
  dependencies: RetryDependencies = {},
): Promise<T> {
  const configured = { ...defaultPolicy, ...policy };
  const maximumAttempts = Math.max(1, configured.maximumAttempts);
  const sleep =
    dependencies.sleep ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const random = dependencies.random ?? Math.random;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      const retryable =
        attempt < maximumAttempts &&
        (dependencies.shouldRetry?.(error, attempt) ?? true);
      if (!retryable) {
        throw error;
      }
      const exponentialDelay = Math.min(
        configured.maximumDelayMilliseconds,
        configured.initialDelayMilliseconds *
          configured.multiplier ** (attempt - 1),
      );
      const jitter =
        exponentialDelay * configured.jitterRatio * (random() * 2 - 1);
      await sleep(Math.max(0, Math.round(exponentialDelay + jitter)));
    }
  }

  throw new Error("Retry policy exhausted without returning or throwing.");
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMilliseconds: number,
  message = "Operation timed out.",
): Promise<T> {
  if (timeoutMilliseconds <= 0) {
    throw new Error("Timeout must be greater than zero.");
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMilliseconds);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  readonly failureThreshold: number;
  readonly resetTimeoutMilliseconds: number;
  readonly now?: () => number;
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  private circuitState: CircuitState = "closed";
  private readonly now: () => number;

  constructor(private readonly options: CircuitBreakerOptions) {
    if (options.failureThreshold < 1 || options.resetTimeoutMilliseconds < 1) {
      throw new Error("Circuit breaker thresholds must be greater than zero.");
    }
    this.now = options.now ?? Date.now;
  }

  state(): CircuitState {
    if (
      this.circuitState === "open" &&
      this.openedAt !== null &&
      this.now() - this.openedAt >= this.options.resetTimeoutMilliseconds
    ) {
      this.circuitState = "half_open";
    }
    return this.circuitState;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state() === "open") {
      throw new Error("Circuit breaker is open.");
    }
    try {
      const result = await operation();
      this.failures = 0;
      this.openedAt = null;
      this.circuitState = "closed";
      return result;
    } catch (error) {
      this.failures += 1;
      if (
        this.circuitState === "half_open" ||
        this.failures >= this.options.failureThreshold
      ) {
        this.circuitState = "open";
        this.openedAt = this.now();
      }
      throw error;
    }
  }
}
