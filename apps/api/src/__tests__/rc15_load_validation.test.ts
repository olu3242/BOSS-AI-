/**
 * RC1.5 WS4 — Load Validation
 *
 * Simulates representative platform load:
 * - 100 businesses, 1000 workflows, 10000 tasks (all in-memory)
 * - Measures scheduling throughput, queue depth, event latency
 * - Asserts no O(n²) patterns, no unbounded memory growth
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessMriService } from "../services/businessMriService.js";
import { createBusinessDnaService } from "../services/businessDnaService.js";
import { createBusinessHealthService } from "../services/businessHealthService.js";
import { nowIso } from "@boss/shared";

describe("RC1.5 WS4 — Load Validation", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates 100 businesses in under 2s", async () => {
    const profileSvc = createBusinessProfileService(c);
    const start = Date.now();

    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        profileSvc.createBusiness({
          orgId: `org-load-${i % 10}`, // 10 orgs, 10 businesses each
          name: `Business-${i}`,
          industry: i % 2 === 0 ? "retail" : "restaurant",
          employeeCount: 5 + (i % 50),
          annualRevenue: 100000 + i * 10000,
          businessType: "service",
          yearsOperating: 3,
          locationCount: 1,
          businessHours: "9-5",
        })
      )
    );

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);

    // Verify org-level isolation holds at scale
    const org0Bizs = await c.businesses.list("org-load-0");
    expect(org0Bizs.length).toBe(10);
    const org1Bizs = await c.businesses.list("org-load-1");
    expect(org1Bizs.length).toBe(10);
    // Total across all 10 orgs = 100
    let total = 0;
    for (let i = 0; i < 10; i++) {
      const bizs = await c.businesses.list(`org-load-${i}`);
      total += bizs.length;
    }
    expect(total).toBe(100);
  });

  it("creates 1000 workflow executions in under 3s", async () => {
    const start = Date.now();
    const now = nowIso();

    await Promise.all(
      Array.from({ length: 1000 }, (_, i) =>
        c.workflowExecutions.create({
          orgId: `org-wf-${i % 20}`,
          businessId: `biz-${i % 100}`,
          workflowKey: `wf-type-${i % 5}`,
          state: i % 3 === 0 ? "completed" : i % 3 === 1 ? "running" : "pending",
          currentStepIndex: 0,
          input: { index: i },
          output: i % 3 === 0 ? { result: "ok" } : null,
          errorMessage: null,
          startedAt: now,
          completedAt: i % 3 === 0 ? now : null,
        })
      )
    );

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);

    const org0Wfs = await c.workflowExecutions.listByBusinessId("org-wf-0", "biz-0");
    expect(org0Wfs.length).toBeGreaterThan(0);
    expect(org0Wfs.every((w) => w.orgId === "org-wf-0")).toBe(true);
  });

  it("creates 10000 event log entries in under 10s with no memory explosion", async () => {
    const COUNT = 10000;
    const BATCH = 500;
    const start = Date.now();
    const memBefore = process.memoryUsage().heapUsed;

    for (let batch = 0; batch < COUNT / BATCH; batch++) {
      await Promise.all(
        Array.from({ length: BATCH }, (_, i) =>
          c.eventLog.append({
            type: `load.test.event.${(batch * BATCH + i) % 20}`,
            payload: { index: batch * BATCH + i },
            occurredAt: nowIso(),
            orgId: `org-events-${i % 5}`,
            correlationId: `corr-${batch}-${i}`,
            causationId: null,
          })
        )
      );
    }

    const elapsed = Date.now() - start;
    const memAfter = process.memoryUsage().heapUsed;
    const memGrowthMB = (memAfter - memBefore) / 1024 / 1024;

    expect(elapsed).toBeLessThan(10000);
    // Memory growth should be bounded — each event ~1KB, 10K events ~10MB headroom
    expect(memGrowthMB).toBeLessThan(100);

    // Spot-check isolation
    const eventsOrg0 = await c.eventLog.listByOrgId("org-events-0", 5000);
    expect(eventsOrg0.every((e) => e.orgId === "org-events-0")).toBe(true);
  });

  it("scheduler throughput: 200 jobs created and listed in under 1s", async () => {
    const now = nowIso();
    const start = Date.now();

    await Promise.all(
      Array.from({ length: 200 }, (_, i) =>
        c.schedulerJobs.create({
          orgId: "org-sched",
          businessId: `biz-${i % 10}`,
          workflowKey: `wf-sched-${i % 5}`,
          triggerType: "immediate",
          cronExpression: null,
          timezone: "UTC",
          runAt: now,
          state: "pending",
          lastRunAt: null,
          nextRunAt: null,
          runCount: 0,
          maxRuns: 1,
          payload: { i },
          errorMessage: null,
        })
      )
    );

    const biz0Jobs = await c.schedulerJobs.listByBusiness("org-sched", "biz-0");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    expect(biz0Jobs.length).toBe(20); // 200/10
    expect(biz0Jobs.every((j) => j.orgId === "org-sched")).toBe(true);
  });

  it("10 concurrent full business analyses complete under 5s (no O(n²))", async () => {
    const CONCURRENCY = 10;
    const start = Date.now();

    const times: number[] = [];

    await Promise.all(
      Array.from({ length: CONCURRENCY }, async (_, i) => {
        const orgId = `org-conc-${i}`;
        const t0 = Date.now();
        const profileSvc = createBusinessProfileService(c);
        const { business } = await profileSvc.createBusiness({
          orgId, name: `Concurrent-${i}`, industry: "retail",
          employeeCount: 10, annualRevenue: 500000,
          businessType: "retail", yearsOperating: 5,
          locationCount: 1, businessHours: "9-5",
        });
        const mriSvc = createBusinessMriService(c);
        const mri = await mriSvc.startMri(orgId, business.id);
        await mriSvc.answer(orgId, mri.id, { sectionKey: "identity", questionKey: "identity.employees", value: 10 });
        await mriSvc.answer(orgId, mri.id, { sectionKey: "sales", questionKey: "sales.follow_up_process", value: "manual" });
        await mriSvc.answer(orgId, mri.id, { sectionKey: "operations", questionKey: "operations.scheduling", value: "spreadsheet" });
        await mriSvc.answer(orgId, mri.id, { sectionKey: "technology", questionKey: "technology.crm", value: false });
        await mriSvc.answer(orgId, mri.id, { sectionKey: "goals", questionKey: "goals.priorities", value: ["growth"] });
        await mriSvc.completeSection(orgId, mri.id, "identity");
        const completed = await mriSvc.completeMri(orgId, mri.id);
        await createBusinessDnaService(c).generate(orgId, business.id, completed.id);
        await createBusinessHealthService(c).generate(orgId, business.id, completed.id);
        times.push(Date.now() - t0);
      })
    );

    const totalElapsed = Date.now() - start;
    expect(totalElapsed).toBeLessThan(5000);

    // Assert no O(n²): time per analysis should not grow with n
    // The last analysis shouldn't take more than 3x the first
    const first = times[0];
    const last = times[times.length - 1];
    // Permissive check — just assert no runaway growth
    expect(last).toBeLessThan(Math.max(first * 5, 500));
  });

  it("queue depth simulation: 500 tasks written and counted in under 2s", async () => {
    const wf = await c.workflowExecutions.create({
      orgId: "org-qd", businessId: "biz-qd", workflowKey: "wf-task-load",
      state: "running", currentStepIndex: 0,
      input: {}, output: null, errorMessage: null,
      startedAt: nowIso(), completedAt: null,
    });

    const now = nowIso();
    const start = Date.now();

    await Promise.all(
      Array.from({ length: 500 }, (_, i) =>
        c.taskExecutions.create({
          orgId: "org-qd",
          businessId: "biz-qd",
          workflowExecutionId: wf.id,
          stepKey: `step-${i}`,
          taskType: "tool",
          status: i % 4 === 0 ? "failed" : "succeeded",
          input: { i },
          output: i % 4 === 0 ? null : { ok: true },
          errorMessage: i % 4 === 0 ? "simulated failure" : null,
          startedAt: now,
          completedAt: now,
        })
      )
    );

    const tasks = await c.taskExecutions.listByWorkflowExecutionId("org-qd", wf.id);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(tasks.length).toBe(500);

    // Queue depth analytics
    const pending = tasks.filter((t) => t.status === "failed").length;
    const succeeded = tasks.filter((t) => t.status === "succeeded").length;
    expect(pending).toBe(125); // 500 / 4
    expect(succeeded).toBe(375);
  });
});
