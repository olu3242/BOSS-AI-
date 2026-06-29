export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
}

export const defaultRetryPolicy: RetryPolicy = { maxAttempts: 3, baseDelayMs: 50 };

export interface RetryOutcome<T> {
  result: T;
  attemptCount: number;
}

export async function withRetry<T>(
  policy: RetryPolicy,
  attempt: (attemptNumber: number) => Promise<T>,
  isRetryable: (result: T) => boolean,
  onRetryScheduled?: (attemptNumber: number, delayMs: number) => void,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<RetryOutcome<T>> {
  let lastResult: T;
  for (let attemptNumber = 1; attemptNumber <= policy.maxAttempts; attemptNumber++) {
    lastResult = await attempt(attemptNumber);
    if (!isRetryable(lastResult) || attemptNumber === policy.maxAttempts) {
      return { result: lastResult, attemptCount: attemptNumber };
    }
    const delayMs = policy.baseDelayMs * attemptNumber;
    onRetryScheduled?.(attemptNumber + 1, delayMs);
    await sleep(delayMs);
  }
  return { result: lastResult!, attemptCount: policy.maxAttempts };
}
