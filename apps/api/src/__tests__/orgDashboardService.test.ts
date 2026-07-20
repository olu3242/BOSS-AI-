import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createOrgDashboardService } from "../services/orgDashboardService.js";

describe("OrgDashboardService", () => {
  it("aggregates tenant-scoped health and alert data", async () => {
    const repos = createInMemoryContainer();
    const service = createOrgDashboardService(repos);
    const orgId = "dashboard-org";
    const critical = await repos.businesses.create({
      orgId,
      name: "Critical Business",
      industry: "services",
      employeeCount: 5,
      annualRevenue: 250000,
    });
    const healthy = await repos.businesses.create({
      orgId,
      name: "Healthy Business",
      industry: "services",
      employeeCount: 8,
      annualRevenue: 500000,
    });
    await repos.businessHealth.upsert({
      orgId,
      businessId: critical.id,
      overallScore: 35,
      generatedAt: new Date().toISOString(),
    });
    await repos.businessHealth.upsert({
      orgId,
      businessId: healthy.id,
      overallScore: 88,
      generatedAt: new Date().toISOString(),
    });

    const result = await service.get(orgId);

    expect(result.businessCount).toBe(2);
    expect(result.healthDistribution).toEqual({
      excellent: 1,
      good: 0,
      needsAttention: 0,
      critical: 1,
    });
    expect(result.topAlerts).toEqual([
      {
        businessId: critical.id,
        businessName: "Critical Business",
        healthScore: 35,
      },
    ]);
    expect(result.pendingApprovalsCount).toBe(0);
    expect(result.revenueAtRisk).toBe(0);
  });

  it("does not leak businesses from another organization", async () => {
    const repos = createInMemoryContainer();
    const service = createOrgDashboardService(repos);
    await repos.businesses.create({
      orgId: "other-org",
      name: "Other Tenant",
      industry: "services",
      employeeCount: 2,
      annualRevenue: 100000,
    });

    expect(await service.get("target-org")).toMatchObject({
      businessCount: 0,
      topAlerts: [],
      recentDecisions: [],
    });
  });
});
