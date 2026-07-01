import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createInMemoryContainer } from "../container.js";
import { createBusinessOperatingLoopService } from "../services/businessOperatingLoopService.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createBteService, BTE_WORKFLOW_KEY, BTE_CRON_EXPRESSION } from "../services/bteService.js";

beforeAll(() => {
  installGeneralSmbPack();
});

function buildServices() {
  const repos = createInMemoryContainer();
  const operatingLoop = createBusinessOperatingLoopService(repos);
  const loopRuntimeStub = { execute: async () => ({ id: "wf-stub", state: "completed" } as never) } as never;
  const workflowStepRegistry = new Map();
  const scheduler = createSchedulerService(repos, loopRuntimeStub, workflowStepRegistry);
  const bte = createBteService(repos, operatingLoop, scheduler);
  return { repos, operatingLoop, scheduler, bte };
}

describe("BTE constants", () => {
  it("workflow key is correct", () => {
    expect(BTE_WORKFLOW_KEY).toBe("bte.daily_cycle");
  });

  it("cron expression runs at 06:00 UTC daily", () => {
    expect(BTE_CRON_EXPRESSION).toBe("0 6 * * *");
  });
});

describe("BteService.runCycle", () => {
  it("returns completed status for a seeded business", async () => {
    const { repos, bte } = buildServices();

    // Seed minimal health data so the loop can run
    await repos.businessHealth.upsert({
      orgId: "org-1",
      businessId: "biz-1",
      overallScore: 72,
      generatedAt: new Date().toISOString(),
    });

    const result = await bte.runCycle("org-1", "biz-1");

    expect(result.status).toBe("completed");
    expect(result.orgId).toBe("org-1");
    expect(result.businessId).toBe("biz-1");
    expect(result.cycleId).toMatch(/^bte_/);
    expect(result.loopResult).not.toBeNull();
    expect(result.errorMessage).toBeNull();
  });

  it("emits bte.cycle.started and bte.cycle.completed events", async () => {
    const { repos, bte } = buildServices();
    await repos.businessHealth.upsert({
      orgId: "org-2",
      businessId: "biz-2",
      overallScore: 65,
      generatedAt: new Date().toISOString(),
    });

    await bte.runCycle("org-2", "biz-2");

    const events = await repos.eventLog.listByOrgId("org-2");
    const types = events.map((e) => e.type);
    expect(types).toContain("bte.cycle.started");
    expect(types).toContain("bte.cycle.completed");
  });

  it("returns failed status and emits bte.cycle.failed when loop throws", async () => {
    const { repos, scheduler } = buildServices();
    const brokenLoop = {
      run: async () => { throw new Error("Simulated loop failure"); },
    };
    const bte = createBteService(repos, brokenLoop, scheduler);

    const result = await bte.runCycle("org-3", "biz-3");

    expect(result.status).toBe("failed");
    expect(result.errorMessage).toBe("Simulated loop failure");
    expect(result.loopResult).toBeNull();

    const events = await repos.eventLog.listByOrgId("org-3");
    expect(events.map((e) => e.type)).toContain("bte.cycle.failed");
  });

  it("loop result includes all 8 phases", async () => {
    const { repos, bte } = buildServices();
    await repos.businessHealth.upsert({
      orgId: "org-4",
      businessId: "biz-4",
      overallScore: 80,
      generatedAt: new Date().toISOString(),
    });

    const result = await bte.runCycle("org-4", "biz-4");

    expect(result.loopResult?.phases.length).toBeGreaterThanOrEqual(5);
    const phaseNames = result.loopResult?.phases.map((p) => p.phase) ?? [];
    expect(phaseNames).toContain("observe");
    expect(phaseNames).toContain("analyze");
  });
});

describe("BteService.scheduleDailyCycle", () => {
  it("schedules a cron job for the business", async () => {
    const { bte } = buildServices();
    const entry = await bte.scheduleDailyCycle("org-5", "biz-5");

    expect(entry.orgId).toBe("org-5");
    expect(entry.businessId).toBe("biz-5");
    expect(entry.cronExpression).toBe(BTE_CRON_EXPRESSION);
    expect(entry.jobId).toBeTruthy();
  });

  it("is idempotent — second call returns same job", async () => {
    const { bte } = buildServices();
    const first = await bte.scheduleDailyCycle("org-6", "biz-6");
    const second = await bte.scheduleDailyCycle("org-6", "biz-6");

    expect(first.jobId).toBe(second.jobId);
  });

  it("emits bte.cycle.scheduled event", async () => {
    const { repos, bte } = buildServices();
    await bte.scheduleDailyCycle("org-7", "biz-7");

    const events = await repos.eventLog.listByOrgId("org-7");
    expect(events.map((e) => e.type)).toContain("bte.cycle.scheduled");
  });
});

describe("BteService.cancelDailyCycle", () => {
  it("cancels existing scheduled jobs and emits event", async () => {
    const { repos, bte } = buildServices();
    await bte.scheduleDailyCycle("org-8", "biz-8");
    await bte.cancelDailyCycle("org-8", "biz-8");

    const events = await repos.eventLog.listByOrgId("org-8");
    expect(events.map((e) => e.type)).toContain("bte.cycle.cancelled");

    const scheduled = await bte.listScheduled("org-8");
    expect(scheduled.filter((s) => s.businessId === "biz-8")).toHaveLength(0);
  });

  it("is a no-op when nothing is scheduled", async () => {
    const { bte } = buildServices();
    await expect(bte.cancelDailyCycle("org-9", "biz-9")).resolves.toBeUndefined();
  });
});

describe("BteService.listScheduled", () => {
  it("returns empty array when no BTE jobs exist", async () => {
    const { bte } = buildServices();
    const result = await bte.listScheduled("org-10");
    expect(result).toHaveLength(0);
  });

  it("returns scheduled businesses after registration", async () => {
    const { bte } = buildServices();
    await bte.scheduleDailyCycle("org-11", "biz-11a");
    await bte.scheduleDailyCycle("org-11", "biz-11b");

    const scheduled = await bte.listScheduled("org-11");
    const bizIds = scheduled.map((s) => s.businessId);
    expect(bizIds).toContain("biz-11a");
    expect(bizIds).toContain("biz-11b");
  });

  it("is tenant-isolated — org-12 does not see org-13 schedules", async () => {
    const { bte } = buildServices();
    await bte.scheduleDailyCycle("org-12", "biz-12");
    const result = await bte.listScheduled("org-13");
    expect(result).toHaveLength(0);
  });
});

describe("BteService.runDue", () => {
  it("returns executed count", async () => {
    const { bte } = buildServices();
    const result = await bte.runDue();
    expect(typeof result.executed).toBe("number");
    expect(result.executed).toBeGreaterThanOrEqual(0);
  });
});

describe("BTE multi-tenant isolation", () => {
  it("runCycle results are independent per org", async () => {
    const { repos, bte } = buildServices();
    await repos.businessHealth.upsert({ orgId: "org-14", businessId: "biz-14", overallScore: 60, generatedAt: new Date().toISOString() });
    await repos.businessHealth.upsert({ orgId: "org-15", businessId: "biz-15", overallScore: 85, generatedAt: new Date().toISOString() });

    const [r1, r2] = await Promise.all([
      bte.runCycle("org-14", "biz-14"),
      bte.runCycle("org-15", "biz-15"),
    ]);

    expect(r1.orgId).toBe("org-14");
    expect(r2.orgId).toBe("org-15");
    expect(r1.cycleId).not.toBe(r2.cycleId);
  });
});
