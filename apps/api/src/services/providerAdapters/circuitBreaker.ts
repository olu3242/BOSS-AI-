export type CircuitState = "closed" | "open" | "half_open";

interface CircuitRecord {
  state: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export const defaultCircuitBreakerOptions: CircuitBreakerOptions = {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
};

/**
 * Per-provider, in-process circuit breaker. Tracks consecutive failures only —
 * no distributed/shared state across instances, consistent with the
 * single-process scope of Goal 16.
 */
export interface CircuitBreaker {
  canAttempt(providerKey: string): boolean;
  recordSuccess(providerKey: string): { closedFromOpen: boolean };
  recordFailure(providerKey: string): { openedNow: boolean };
}

export function createCircuitBreaker(options: CircuitBreakerOptions = defaultCircuitBreakerOptions): CircuitBreaker {
  const records = new Map<string, CircuitRecord>();

  function getRecord(providerKey: string): CircuitRecord {
    let record = records.get(providerKey);
    if (!record) {
      record = { state: "closed", consecutiveFailures: 0, openedAt: null };
      records.set(providerKey, record);
    }
    return record;
  }

  return {
    canAttempt(providerKey) {
      const record = getRecord(providerKey);
      if (record.state === "closed") return true;
      if (record.state === "open") {
        if (record.openedAt !== null && Date.now() - record.openedAt >= options.resetTimeoutMs) {
          record.state = "half_open";
          return true;
        }
        return false;
      }
      return true;
    },
    recordSuccess(providerKey) {
      const record = getRecord(providerKey);
      const closedFromOpen = record.state !== "closed";
      record.state = "closed";
      record.consecutiveFailures = 0;
      record.openedAt = null;
      return { closedFromOpen };
    },
    recordFailure(providerKey) {
      const record = getRecord(providerKey);
      record.consecutiveFailures += 1;
      if (record.state === "half_open" || record.consecutiveFailures >= options.failureThreshold) {
        const openedNow = record.state !== "open";
        record.state = "open";
        record.openedAt = Date.now();
        return { openedNow };
      }
      return { openedNow: false };
    },
  };
}
