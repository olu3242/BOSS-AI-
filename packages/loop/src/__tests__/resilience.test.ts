import { describe, expect, it } from "vitest";
import { CircuitBreaker, withRetry, withTimeout } from "../index.js";

describe("runtime resilience", () => {
  it("retries with bounded exponential backoff", async () => {
    const delays: number[] = [];
    let attempts = 0;

    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("temporary");
        }
        return "completed";
      },
      {
        maximumAttempts: 3,
        initialDelayMilliseconds: 10,
        maximumDelayMilliseconds: 100,
        multiplier: 2,
        jitterRatio: 0,
      },
      {
        sleep: async (milliseconds) => {
          delays.push(milliseconds);
        },
      },
    );

    expect(result).toBe("completed");
    expect(attempts).toBe(3);
    expect(delays).toEqual([10, 20]);
  });

  it("enforces timeouts", async () => {
    await expect(
      withTimeout(
        new Promise((resolve) => setTimeout(resolve, 20)),
        1,
        "provider timeout",
      ),
    ).rejects.toThrow("provider timeout");
  });

  it("opens, probes, and closes a circuit", async () => {
    let now = 1_000;
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMilliseconds: 100,
      now: () => now,
    });

    await expect(breaker.execute(async () => Promise.reject(new Error("one"))))
      .rejects.toThrow("one");
    await expect(breaker.execute(async () => Promise.reject(new Error("two"))))
      .rejects.toThrow("two");
    expect(breaker.state()).toBe("open");
    await expect(breaker.execute(async () => "blocked")).rejects.toThrow(
      "Circuit breaker is open.",
    );

    now += 100;
    expect(breaker.state()).toBe("half_open");
    await expect(breaker.execute(async () => "healthy")).resolves.toBe("healthy");
    expect(breaker.state()).toBe("closed");
  });
});
