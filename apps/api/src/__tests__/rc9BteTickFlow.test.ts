import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createInMemoryContainer } from "../container.js";
import { createBusinessOperatingLoopService } from "../services/businessOperatingLoopService.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createBteService } from "../services/bteService.js";

beforeAll(() => {
  installGeneralSmbPack();
});

type LoopCallRecord = { orgId: string; businessId: string; workflowKey: string };

function buildServices(loopCalls?: LoopCallRecord[]) {
  const repos = createInMemoryContainer();
  const operatingLoop = createBusinessOperatingLoopService(repos);

  // Spy loop runtime: records calls, delegates to loopRuntime.execute
  const spyRuntime = {
    execute: async (orgId: string, businessId: string, workflowKey: string) => {
      loopCalls?.push({ orgId, businessId, workflowKey });
      return { output: null, errorMessage: null };
    },
  } as never;

  const scheduler = createSchedulerService(repos, spyRuntime, new Map());
  const bte = createBteService(repos, operatingLoop, scheduler);
  return { repos, bte, scheduler };
}

describe("BTE tick — runDue with no scheduled jobs", () => {
  it("returns executed: 0 when no jobs are due", async () => {
    const { bte } = buildServices();
    const result = await bte.runDue();
    expect(result.executed).toBe(0);
  });
});

describe("BTE tick — runDue processes freshly scheduled jobs", () => {
  it("executes a scheduled BTE job on first tick", async () => {
    const calls: LoopCallRecord[] = [];
    const { repos, bte } = buildServices(calls);

    const biz = await repos.businesses.create({
      orgId: "org-1",
      name: "Tick Biz",
      industry: "hvac",
      employeeCount: 5,
      annualRevenue: 500000,
    });

    await bte.scheduleDailyCycle("org-1", biz.id);

    const result = await bte.runDue();
    expect(result.executed).toBe(1);
  });

  it("executes jobs for all scheduled businesses in one tick", async () => {
    const calls: LoopCallRecord[] = [];
    const { repos, bte } = buildServices(calls);

    const biz1 = await repos.businesses.create({ orgId: "org-2", name: "Biz A", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const biz2 = await repos.businesses.create({ orgId: "org-2", name: "Biz B", industry: "plumbing", employeeCount: 3, annualRevenue: 300000 });

    await bte.scheduleDailyCycle("org-2", biz1.id);
    await bte.scheduleDailyCycle("org-2", biz2.id);

    const result = await bte.runDue();
    expect(result.executed).toBe(2);
  });

  it("is cross-org — tick processes businesses from all orgs", async () => {
    const calls: LoopCallRecord[] = [];
    const { repos, bte } = buildServices(calls);

    const bizA = await repos.businesses.create({ orgId: "org-3", name: "Org3 Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const bizB = await repos.businesses.create({ orgId: "org-4", name: "Org4 Biz", industry: "plumbing", employeeCount: 2, annualRevenue: 200000 });

    await bte.scheduleDailyCycle("org-3", bizA.id);
    await bte.scheduleDailyCycle("org-4", bizB.id);

    const result = await bte.runDue();
    expect(result.executed).toBe(2);
  });

  it("does not double-execute a job already running", async () => {
    const calls: LoopCallRecord[] = [];
    const { repos, bte } = buildServices(calls);

    const biz = await repos.businesses.create({ orgId: "org-5", name: "Single", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await bte.scheduleDailyCycle("org-5", biz.id);

    // First tick executes it and marks it running/completed
    const first = await bte.runDue();
    expect(first.executed).toBe(1);

    // Second tick should not re-execute (job was promoted to running then pending with future nextRunAt)
    // In the in-memory impl, after execution the job's runAt is updated via nextRunAt (cron: next fire)
    // So a second immediate tick should yield 0 more executions
    const second = await bte.runDue();
    expect(second.executed).toBe(0);
  });

  it("cancelled BTE cycle is not picked up by tick", async () => {
    const calls: LoopCallRecord[] = [];
    const { repos, bte } = buildServices(calls);

    const biz = await repos.businesses.create({ orgId: "org-6", name: "Cancelled Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await bte.scheduleDailyCycle("org-6", biz.id);
    await bte.cancelDailyCycle("org-6", biz.id);

    const result = await bte.runDue();
    expect(result.executed).toBe(0);
  });
});

describe("BTE tick — emits events", () => {
  it("emits bte.cycle.scheduled event when scheduleDailyCycle is called", async () => {
    const { repos, bte } = buildServices();
    const biz = await repos.businesses.create({ orgId: "org-7", name: "Event Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await bte.scheduleDailyCycle("org-7", biz.id);

    const events = await repos.eventLog.listByType("bte.cycle.scheduled", 10);
    expect(events.some((e) => (e.payload as { businessId: string }).businessId === biz.id)).toBe(true);
  });

  it("emits bte.cycle.cancelled event when cancelDailyCycle is called", async () => {
    const { repos, bte } = buildServices();
    const biz = await repos.businesses.create({ orgId: "org-8", name: "Cancel Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await bte.scheduleDailyCycle("org-8", biz.id);
    await bte.cancelDailyCycle("org-8", biz.id);

    const events = await repos.eventLog.listByType("bte.cycle.cancelled", 10);
    expect(events.some((e) => (e.payload as { businessId: string }).businessId === biz.id)).toBe(true);
  });
});
