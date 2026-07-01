import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createBusinessOperatingLoopService } from "../services/businessOperatingLoopService.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createBteService } from "../services/bteService.js";
import { BTE_CRON_EXPRESSION } from "../services/bteService.js";

beforeAll(() => {
  installGeneralSmbPack();
});

const loopRuntimeStub = { execute: async () => ({ output: null, errorMessage: null }) } as never;

function buildServices() {
  const repos = createInMemoryContainer();
  const businessProfile = createBusinessProfileService(repos);
  const operatingLoop = createBusinessOperatingLoopService(repos);
  const scheduler = createSchedulerService(repos, loopRuntimeStub, new Map());
  const bte = createBteService(repos, operatingLoop, scheduler);

  // Wire auto-enrollment (mirrors index.ts RC8 event subscription)
  repos.eventBus.subscribe<{ orgId: string; businessId: string }>(
    "business.created",
    (e) => {
      void bte.scheduleDailyCycle(e.payload.orgId, e.payload.businessId);
    }
  );

  return { repos, businessProfile, bte, scheduler };
}

describe("RC8 — Auto BTE Enrollment on business.created", () => {
  it("auto-schedules BTE cycle when a business is created", async () => {
    const { businessProfile, bte } = buildServices();

    const { business } = await businessProfile.createBusiness({
      orgId: "org-1",
      name: "Acme HVAC",
      industry: "hvac",
      employeeCount: 5,
      annualRevenue: 500000,
      businessType: "service",
      yearsOperating: 5,
      locationCount: 1,
      businessHours: "08:00-17:00",
    });

    // Give the async event handler a tick to resolve
    await new Promise((r) => setImmediate(r));

    const scheduled = await bte.listScheduled("org-1");
    expect(scheduled.some((s) => s.businessId === business.id)).toBe(true);
  });

  it("BTE schedule entry has expected workflowKey", async () => {
    const { businessProfile, bte } = buildServices();

    const { business } = await businessProfile.createBusiness({
      orgId: "org-2",
      name: "Roto Plumbing",
      industry: "plumbing",
      employeeCount: 3,
      annualRevenue: 300000,
      businessType: "service",
      yearsOperating: 5,
      locationCount: 1,
      businessHours: "08:00-17:00",
    });

    await new Promise((r) => setImmediate(r));

    const scheduled = await bte.listScheduled("org-2");
    const entry = scheduled.find((s) => s.businessId === business.id);
    expect(entry?.cronExpression).toBe(BTE_CRON_EXPRESSION);
  });

  it("creates one schedule entry per business, not duplicates", async () => {
    const { businessProfile, bte } = buildServices();

    const { business } = await businessProfile.createBusiness({
      orgId: "org-3",
      name: "Cool HVAC",
      industry: "hvac",
      employeeCount: 2,
      annualRevenue: 200000,
      businessType: "service",
      yearsOperating: 5,
      locationCount: 1,
      businessHours: "08:00-17:00",
    });

    await new Promise((r) => setImmediate(r));

    const scheduled = await bte.listScheduled("org-3");
    const entriesForBiz = scheduled.filter((s) => s.businessId === business.id);
    expect(entriesForBiz).toHaveLength(1);
  });

  it("is tenant-isolated — org-4 schedule does not appear for org-5", async () => {
    const { businessProfile, bte } = buildServices();

    await businessProfile.createBusiness({
      orgId: "org-4",
      name: "Alpha Services",
      industry: "hvac",
      employeeCount: 4,
      annualRevenue: 400000,
      businessType: "service",
      yearsOperating: 5,
      locationCount: 1,
      businessHours: "08:00-17:00",
    });

    await new Promise((r) => setImmediate(r));

    const scheduled = await bte.listScheduled("org-5");
    expect(scheduled).toHaveLength(0);
  });

  it("enrolls multiple businesses in the same org independently", async () => {
    const { businessProfile, bte } = buildServices();

    const { business: biz1 } = await businessProfile.createBusiness({
      orgId: "org-6",
      name: "First Biz",
      industry: "hvac",
      employeeCount: 5,
      annualRevenue: 500000,
      businessType: "service",
      yearsOperating: 5,
      locationCount: 1,
      businessHours: "08:00-17:00",
    });

    const { business: biz2 } = await businessProfile.createBusiness({
      orgId: "org-6",
      name: "Second Biz",
      industry: "plumbing",
      employeeCount: 3,
      annualRevenue: 300000,
      businessType: "service",
      yearsOperating: 5,
      locationCount: 1,
      businessHours: "08:00-17:00",
    });

    await new Promise((r) => setImmediate(r));

    const scheduled = await bte.listScheduled("org-6");
    expect(scheduled.some((s) => s.businessId === biz1.id)).toBe(true);
    expect(scheduled.some((s) => s.businessId === biz2.id)).toBe(true);
  });
});
