import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryExecutionMetricsRepository } from "@boss/db";

describe("ExecutionMetricsRepository (in-memory)", () => {
  let repo: ReturnType<typeof createInMemoryExecutionMetricsRepository>;

  beforeEach(() => {
    repo = createInMemoryExecutionMetricsRepository();
  });

  const ORG = "org-1";
  const WF_A = "wf-a";
  const WF_B = "wf-b";

  const WINDOW = {
    windowStart: "2026-07-06T00:00:00.000Z",
    windowEnd: "2026-07-07T00:00:00.000Z",
  };

  it("upsert stores and returns a metrics entry", async () => {
    const entry = await repo.upsert({
      orgId: ORG, workflowId: WF_A,
      ...WINDOW,
      runCount: 100, successCount: 95, failureCount: 5,
      p50Ms: 120, p95Ms: 450, p99Ms: 900, minMs: 50, maxMs: 1200,
    });

    expect(entry.id).toBeTruthy();
    expect(entry.orgId).toBe(ORG);
    expect(entry.workflowId).toBe(WF_A);
    expect(entry.runCount).toBe(100);
    expect(entry.p50Ms).toBe(120);
    expect(entry.p95Ms).toBe(450);
    expect(entry.computedAt).toBeTruthy();
  });

  it("upsert is idempotent — same window overwrites, preserves id", async () => {
    const first = await repo.upsert({ orgId: ORG, workflowId: WF_A, ...WINDOW, runCount: 50, successCount: 50, failureCount: 0, p50Ms: 100, p95Ms: 300, p99Ms: 500, minMs: 40, maxMs: 600 });
    const second = await repo.upsert({ orgId: ORG, workflowId: WF_A, ...WINDOW, runCount: 75, successCount: 70, failureCount: 5, p50Ms: 130, p95Ms: 400, p99Ms: 700, minMs: 30, maxMs: 900 });

    expect(second.id).toBe(first.id);
    expect(second.runCount).toBe(75);
    expect(second.p50Ms).toBe(130);
  });

  it("latestForWorkflow returns the most recent window", async () => {
    await repo.upsert({ orgId: ORG, workflowId: WF_A, windowStart: "2026-07-05T00:00:00.000Z", windowEnd: "2026-07-06T00:00:00.000Z", runCount: 10, successCount: 10, failureCount: 0, p50Ms: 80, p95Ms: 200, p99Ms: 400, minMs: 30, maxMs: 500 });
    await repo.upsert({ orgId: ORG, workflowId: WF_A, ...WINDOW, runCount: 20, successCount: 19, failureCount: 1, p50Ms: 90, p95Ms: 220, p99Ms: 450, minMs: 35, maxMs: 550 });

    const latest = await repo.latestForWorkflow(ORG, WF_A);
    expect(latest?.runCount).toBe(20);
    expect(latest?.windowStart).toBe(WINDOW.windowStart);
  });

  it("latestForWorkflow returns null for unknown workflow", async () => {
    expect(await repo.latestForWorkflow(ORG, "unknown-wf")).toBeNull();
  });

  it("listByOrg returns all entries for org sorted by window_start desc", async () => {
    await repo.upsert({ orgId: ORG, workflowId: WF_A, ...WINDOW, runCount: 10, successCount: 10, failureCount: 0, p50Ms: 80, p95Ms: 200, p99Ms: 400, minMs: 30, maxMs: 500 });
    await repo.upsert({ orgId: ORG, workflowId: WF_B, ...WINDOW, runCount: 5, successCount: 5, failureCount: 0, p50Ms: 60, p95Ms: 150, p99Ms: 300, minMs: 20, maxMs: 400 });
    await repo.upsert({ orgId: "other-org", workflowId: WF_A, ...WINDOW, runCount: 999, successCount: 999, failureCount: 0, p50Ms: 1, p95Ms: 2, p99Ms: 3, minMs: 1, maxMs: 3 });

    const entries = await repo.listByOrg(ORG);
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.orgId === ORG)).toBe(true);
  });

  it("refresh returns 0 (noop for in-memory)", async () => {
    expect(await repo.refresh(24)).toBe(0);
  });

  it("p50/p95/p99 can be null (no completed runs with duration)", async () => {
    const entry = await repo.upsert({ orgId: ORG, workflowId: WF_A, ...WINDOW, runCount: 5, successCount: 0, failureCount: 5, p50Ms: null, p95Ms: null, p99Ms: null, minMs: null, maxMs: null });
    expect(entry.p50Ms).toBeNull();
    expect(entry.p99Ms).toBeNull();
  });
});
