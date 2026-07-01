import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createInMemoryContainer } from "../container.js";
import { createBusinessOperatingLoopService } from "../services/businessOperatingLoopService.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createBteService } from "../services/bteService.js";
import { createAiWorkforceService } from "../services/aiWorkforceService.js";
import { createOrgHealthService } from "../services/orgHealthService.js";

beforeAll(() => {
  installGeneralSmbPack();
});

function buildServices() {
  const repos = createInMemoryContainer();
  const operatingLoop = createBusinessOperatingLoopService(repos);
  const scheduler = createSchedulerService(repos, { execute: async () => ({ output: null, errorMessage: null }) } as never, new Map());
  const bte = createBteService(repos, operatingLoop, scheduler);
  const aiWorkforce = createAiWorkforceService(repos);
  const orgHealth = createOrgHealthService(repos, bte, aiWorkforce);
  return { repos, bte, aiWorkforce, orgHealth };
}

describe("OrgHealthService.getOrgSummary — empty org", () => {
  it("returns zero businesses with no data", async () => {
    const { orgHealth } = buildServices();
    const summary = await orgHealth.getOrgSummary("org-empty");
    expect(summary.businessCount).toBe(0);
    expect(summary.averageHealthScore).toBeNull();
    expect(summary.bteCoverage).toBe(0);
    expect(summary.businesses).toHaveLength(0);
  });

  it("includes orgId and generatedAt", async () => {
    const { orgHealth } = buildServices();
    const summary = await orgHealth.getOrgSummary("org-empty-2");
    expect(summary.orgId).toBe("org-empty-2");
    expect(summary.generatedAt).toBeTruthy();
  });
});

describe("OrgHealthService.getOrgSummary — with data", () => {
  it("counts businesses", async () => {
    const { repos, orgHealth } = buildServices();
    await repos.businesses.create({ orgId: "org-1", name: "Business A", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await repos.businesses.create({ orgId: "org-1", name: "Business B", industry: "plumbing", employeeCount: 3, annualRevenue: 300000 });
    const summary = await orgHealth.getOrgSummary("org-1");
    expect(summary.businessCount).toBe(2);
  });

  it("computes average health score", async () => {
    const { repos, orgHealth } = buildServices();
    const bizA = await repos.businesses.create({ orgId: "org-2", name: "Biz A", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const bizB = await repos.businesses.create({ orgId: "org-2", name: "Biz B", industry: "plumbing", employeeCount: 5, annualRevenue: 500000 });
    await repos.businessHealth.upsert({ orgId: "org-2", businessId: bizA.id, overallScore: 80, generatedAt: new Date().toISOString() });
    await repos.businessHealth.upsert({ orgId: "org-2", businessId: bizB.id, overallScore: 60, generatedAt: new Date().toISOString() });
    const summary = await orgHealth.getOrgSummary("org-2");
    expect(summary.averageHealthScore).toBe(70);
  });

  it("classifies health score distribution", async () => {
    const { repos, orgHealth } = buildServices();
    const biz1 = await repos.businesses.create({ orgId: "org-3", name: "Critical Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const biz2 = await repos.businesses.create({ orgId: "org-3", name: "Warning Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const biz3 = await repos.businesses.create({ orgId: "org-3", name: "Healthy Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await repos.businessHealth.upsert({ orgId: "org-3", businessId: biz1.id, overallScore: 30, generatedAt: new Date().toISOString() });
    await repos.businessHealth.upsert({ orgId: "org-3", businessId: biz2.id, overallScore: 55, generatedAt: new Date().toISOString() });
    await repos.businessHealth.upsert({ orgId: "org-3", businessId: biz3.id, overallScore: 85, generatedAt: new Date().toISOString() });
    const summary = await orgHealth.getOrgSummary("org-3");
    expect(summary.healthScoreDistribution.critical).toBe(1);
    expect(summary.healthScoreDistribution.warning).toBe(1);
    expect(summary.healthScoreDistribution.healthy).toBe(1);
  });

  it("computes BTE coverage", async () => {
    const { repos, bte, orgHealth } = buildServices();
    const biz1 = await repos.businesses.create({ orgId: "org-4", name: "Scheduled", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await repos.businesses.create({ orgId: "org-4", name: "Not Scheduled", industry: "plumbing", employeeCount: 5, annualRevenue: 500000 });
    await bte.scheduleDailyCycle("org-4", biz1.id);
    const summary = await orgHealth.getOrgSummary("org-4");
    expect(summary.bteCoverage).toBe(0.5);
  });

  it("is tenant-isolated — org-5 does not see org-6 businesses", async () => {
    const { repos, orgHealth } = buildServices();
    await repos.businesses.create({ orgId: "org-5", name: "Biz 5", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const summary = await orgHealth.getOrgSummary("org-6");
    expect(summary.businessCount).toBe(0);
  });
});

describe("OrgHealthService.getBusinessSummary", () => {
  it("returns null health for a new business", async () => {
    const { repos, orgHealth } = buildServices();
    const biz = await repos.businesses.create({ orgId: "org-7", name: "New Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const summary = await orgHealth.getBusinessSummary("org-7", biz.id);
    expect(summary.overallScore).toBeNull();
    expect(summary.generatedAt).toBeNull();
  });

  it("returns health score when available", async () => {
    const { repos, orgHealth } = buildServices();
    const biz = await repos.businesses.create({ orgId: "org-8", name: "Healthy Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await repos.businessHealth.upsert({ orgId: "org-8", businessId: biz.id, overallScore: 88, generatedAt: new Date().toISOString() });
    const summary = await orgHealth.getBusinessSummary("org-8", biz.id);
    expect(summary.overallScore).toBe(88);
  });

  it("shows bteCycleStatus scheduled when BTE registered", async () => {
    const { repos, bte, orgHealth } = buildServices();
    const biz = await repos.businesses.create({ orgId: "org-9", name: "BTE Biz", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    await bte.scheduleDailyCycle("org-9", biz.id);
    const summary = await orgHealth.getBusinessSummary("org-9", biz.id);
    expect(summary.bteCycleStatus).toBe("scheduled");
  });

  it("shows bteCycleStatus not_scheduled by default", async () => {
    const { repos, orgHealth } = buildServices();
    const biz = await repos.businesses.create({ orgId: "org-10", name: "Unscheduled", industry: "hvac", employeeCount: 5, annualRevenue: 500000 });
    const summary = await orgHealth.getBusinessSummary("org-10", biz.id);
    expect(summary.bteCycleStatus).toBe("not_scheduled");
  });
});
