import { describe, it, expect } from "vitest";
import { createInMemoryContainer, type RepositoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import type { Business } from "@boss/types";

function makeRepos() {
  return createInMemoryContainer();
}

async function seedBusiness(repos: RepositoryContainer): Promise<Business> {
  const { business } = await createBusinessProfileService(repos).createBusiness({
    orgId: "org-1",
    name: "Test Co",
    industry: "retail",
    employeeCount: 10,
    annualRevenue: 500000,
  });
  return business;
}

describe("Goal 19 — KPI Time-Series Persistence (WS1)", () => {
  it("persists KPI readings when measure() is called", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const { persisted, readings } = await api.kpiMeasurement.measure("org-1", business.id);

    expect(persisted.length).toBe(readings.length);
    expect(persisted.length).toBeGreaterThan(0);
    expect(persisted[0]!.orgId).toBe("org-1");
    expect(persisted[0]!.businessId).toBe(business.id);
    expect(persisted[0]!.kpiKey).toBeTruthy();
    expect(persisted[0]!.measuredAt).toBeTruthy();
  });

  it("history() returns all readings for a business", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await api.kpiMeasurement.measure("org-1", business.id);
    await api.kpiMeasurement.measure("org-1", business.id);

    const history = await api.kpiMeasurement.history("org-1", business.id);
    expect(history.length).toBeGreaterThan(0);
  });

  it("history() filtered by kpiKey returns only that KPI", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const { persisted } = await api.kpiMeasurement.measure("org-1", business.id);
    const firstKey = persisted[0]!.kpiKey;

    const filtered = await api.kpiMeasurement.history("org-1", business.id, firstKey);
    expect(filtered.every((r) => r.kpiKey === firstKey)).toBe(true);
  });

  it("isolates KPI readings by business id", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const b1 = await seedBusiness(repos);

    await api.kpiMeasurement.measure("org-1", b1.id);
    const h2 = await api.kpiMeasurement.history("org-1", "different-business-id");
    expect(h2.length).toBe(0);
  });
});

describe("Goal 19 — Business Goals / OKRs (WS8)", () => {
  it("creates a business goal", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const goal = await api.businessGoal.create("org-1", business.id, {
      category: "growth",
      title: "Increase revenue by 20%",
      targetValue: 600000,
      unit: "USD",
    });

    expect(goal.id).toBeTruthy();
    expect(goal.title).toBe("Increase revenue by 20%");
    expect(goal.category).toBe("growth");
    expect(goal.status).toBe("active");
    expect(goal.targetValue).toBe(600000);
  });

  it("lists active goals for a business", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await api.businessGoal.create("org-1", business.id, {
      category: "growth",
      title: "Goal A",
    });
    await api.businessGoal.create("org-1", business.id, {
      category: "operations",
      title: "Goal B",
    });

    const goals = await api.businessGoal.list("org-1", business.id);
    expect(goals.length).toBe(2);
  });

  it("updates goal status to completed", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const goal = await api.businessGoal.create("org-1", business.id, {
      category: "profitability",
      title: "Reduce costs",
    });

    const updated = await api.businessGoal.updateStatus("org-1", goal.id, "completed");
    expect(updated.status).toBe("completed");
  });

  it("filters goals by status", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const g1 = await api.businessGoal.create("org-1", business.id, {
      category: "growth",
      title: "Active goal",
    });
    await api.businessGoal.updateStatus("org-1", g1.id, "completed");
    await api.businessGoal.create("org-1", business.id, {
      category: "operations",
      title: "Still active",
    });

    const active = await api.businessGoal.list("org-1", business.id, "active");
    expect(active.length).toBe(1);
    expect(active[0]!.title).toBe("Still active");
  });

  it("emits business.goal.created event", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await api.businessGoal.create("org-1", business.id, {
      category: "customer_experience",
      title: "Improve NPS",
    });

    const events = await repos.eventLog.listByOrgId("org-1");
    const goalEvent = events.find((e) => e.type === "business.goal.created");
    expect(goalEvent).toBeDefined();
    expect((goalEvent!.payload as { category: string }).category).toBe("customer_experience");
  });
});

describe("Goal 19 — Executive Briefings (WS7)", () => {
  it("generates a daily briefing for a business", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const briefing = await api.executiveBriefing.generate("org-1", business.id, "daily");

    expect(briefing.id).toBeTruthy();
    expect(briefing.period).toBe("daily");
    expect(briefing.headline).toBeTruthy();
    expect(briefing.summary).toBeTruthy();
    expect(briefing.periodStart).toBeTruthy();
    expect(briefing.periodEnd).toBeTruthy();
    expect(briefing.generatedAt).toBeTruthy();
  });

  it("getLatest() returns the most recent briefing", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await api.executiveBriefing.generate("org-1", business.id, "daily");
    await api.executiveBriefing.generate("org-1", business.id, "daily");

    const latest = await api.executiveBriefing.getLatest("org-1", business.id, "daily");
    expect(latest).not.toBeNull();
    expect(latest!.period).toBe("daily");
  });

  it("list() returns all briefings for a business", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await api.executiveBriefing.generate("org-1", business.id, "daily");
    await api.executiveBriefing.generate("org-1", business.id, "weekly");

    const all = await api.executiveBriefing.list("org-1", business.id);
    expect(all.length).toBe(2);
  });

  it("emits business.briefing.generated event", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await api.executiveBriefing.generate("org-1", business.id, "weekly");

    const events = await repos.eventLog.listByOrgId("org-1");
    const briefEvent = events.find((e) => e.type === "business.briefing.generated");
    expect(briefEvent).toBeDefined();
    expect((briefEvent!.payload as { period: string }).period).toBe("weekly");
  });

  it("briefing includes health-based headline when health data present", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await repos.businessHealth.upsert({
      orgId: "org-1",
      businessId: business.id,
      overallScore: 82,
      generatedAt: new Date().toISOString(),
    });

    const briefing = await api.executiveBriefing.generate("org-1", business.id, "daily");
    expect(briefing.headline).toContain("82");
  });
});
