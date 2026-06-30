import { describe, it, expect } from "vitest";
import { computeNextCronRun } from "../services/schedulerService.js";

describe("RC1 — Scheduler Cron nextRunAt (WS3)", () => {
  it("computes next minute for '* * * * *'", () => {
    const base = new Date("2026-07-01T12:00:00Z");
    const next = computeNextCronRun("* * * * *", base);
    expect(next).toBe("2026-07-01T12:01:00.000Z");
  });

  it("computes next hourly run for '0 * * * *'", () => {
    const base = new Date("2026-07-01T12:15:00Z");
    const next = computeNextCronRun("0 * * * *", base);
    expect(next).toBe("2026-07-01T13:00:00.000Z");
  });

  it("computes next daily run at midnight for '0 0 * * *'", () => {
    const base = new Date("2026-07-01T12:00:00Z");
    const next = computeNextCronRun("0 0 * * *", base);
    expect(next).toBe("2026-07-02T00:00:00.000Z");
  });

  it("handles step expressions '*/15 * * * *'", () => {
    const base = new Date("2026-07-01T12:00:00Z");
    const next = computeNextCronRun("*/15 * * * *", base);
    expect(next).toBe("2026-07-01T12:15:00.000Z");
  });

  it("returns null for invalid expressions", () => {
    expect(computeNextCronRun("invalid")).toBeNull();
    expect(computeNextCronRun("* * *")).toBeNull();
  });

  it("computes next run past midnight boundary", () => {
    const base = new Date("2026-07-01T23:45:00Z");
    const next = computeNextCronRun("0 0 * * *", base);
    expect(next).toBe("2026-07-02T00:00:00.000Z");
  });

  it("handles comma-separated minutes '0,30 * * * *'", () => {
    const base = new Date("2026-07-01T12:10:00Z");
    const next = computeNextCronRun("0,30 * * * *", base);
    expect(next).toBe("2026-07-01T12:30:00.000Z");
  });
});
