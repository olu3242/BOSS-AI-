import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { nowIso } from "@boss/shared";

const ORG_ID = "sc000000-0000-0000-0000-000000000001";

describe("Scenario Simulation Engine (Goal 22)", () => {
  let api: ReturnType<typeof createApiFromContainer>;
  let repos: ReturnType<typeof createInMemoryContainer>;
  let businessId: string;

  beforeEach(async () => {
    repos = createInMemoryContainer();
    api = createApiFromContainer(repos);

    const biz = await repos.businesses.create({
      orgId: ORG_ID,
      name: "Scenario Test Co",
      industry: "retail",
      employeeCount: 20,
      annualRevenue: 1_000_000,
    });
    businessId = biz.id;

    await repos.businessHealth.upsert({
      orgId: ORG_ID,
      businessId,
      overallScore: 70,
      generatedAt: nowIso(),
    });
  });

  it("creates and calculates a revenue scenario", async () => {
    const scenario = await api.scenario.create(ORG_ID, businessId, {
      scenarioType: "revenue",
      objective: "Grow top-line revenue by 15%",
      assumptions: [{ key: "revenue_growth_pct", label: "Revenue Growth %", value: 15, unit: "%" }],
      forecastPeriod: "90d",
    });
    expect(scenario.id).toBeDefined();
    expect(scenario.status).toBe("calculated");
    expect(scenario.projectedRevenue).toBeGreaterThan(0);
    expect(scenario.projectedProfit).toBeGreaterThan(scenario.projectedCost * -1);
  });

  it("creates a hiring scenario with cost analysis", async () => {
    const scenario = await api.scenario.create(ORG_ID, businessId, {
      scenarioType: "hiring",
      objective: "Add 3 sales reps",
      assumptions: [
        { key: "new_headcount", label: "New Headcount", value: 3, unit: "people" },
        { key: "avg_salary_annual", label: "Avg Salary", value: 55000, unit: "USD" },
        { key: "productivity_gain_pct", label: "Productivity Gain", value: 12, unit: "%" },
      ],
      forecastPeriod: "365d",
    });
    expect(scenario.scenarioType).toBe("hiring");
    expect(scenario.projectedCost).toBeGreaterThan(0);
  });

  it("lists scenarios for a business", async () => {
    await api.scenario.create(ORG_ID, businessId, { scenarioType: "revenue", objective: "A", assumptions: [], forecastPeriod: "90d" });
    await api.scenario.create(ORG_ID, businessId, { scenarioType: "marketing", objective: "B", assumptions: [], forecastPeriod: "90d" });
    const list = await api.scenario.list(ORG_ID, businessId);
    expect(list.length).toBe(2);
  });

  it("compares multiple scenarios and recommends best", async () => {
    await api.scenario.create(ORG_ID, businessId, {
      scenarioType: "revenue",
      objective: "Grow revenue",
      assumptions: [{ key: "revenue_growth_pct", label: "Growth", value: 10, unit: "%" }],
      forecastPeriod: "90d",
    });
    await api.scenario.create(ORG_ID, businessId, {
      scenarioType: "pricing",
      objective: "Increase prices",
      assumptions: [{ key: "price_lift_pct", label: "Price Lift", value: 8, unit: "%" }],
      forecastPeriod: "90d",
    });

    const { comparison, scenarios } = await api.scenario.compare(ORG_ID, businessId, { scenarioIds: [] });
    expect(comparison.recommendedScenarioId).toBeTruthy();
    expect(comparison.rationale).toBeTruthy();
    expect(scenarios.length).toBe(2);
  });

  it("generates a multi-period forecast", async () => {
    const forecast = await api.scenario.getForecast(ORG_ID, businessId);
    expect(forecast.length).toBe(4);
    const periods = forecast.map((f) => f.period);
    expect(periods).toContain("30d");
    expect(periods).toContain("365d");
    // Longer periods have more projected revenue
    const p30 = forecast.find((f) => f.period === "30d")!;
    const p365 = forecast.find((f) => f.period === "365d")!;
    expect(p365.projectedRevenue).toBeGreaterThan(p30.projectedRevenue);
  });

  it("emits scenario.created event", async () => {
    const events: string[] = [];
    repos.eventBus.subscribe("scenario.created", () => events.push("created"));
    await api.scenario.create(ORG_ID, businessId, { scenarioType: "finance", objective: "Cut costs", assumptions: [], forecastPeriod: "180d" });
    expect(events).toContain("created");
  });
});
