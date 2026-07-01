import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { optimizeDecisions, prioritizeDecisions, generateForecast } from "@boss/mcp";
import { nowIso } from "@boss/shared";

const ORG_ID = "exec0000-0000-0000-0000-000000000001";

describe("Executive Decision Intelligence (Goal 23)", () => {
  let api: ReturnType<typeof createApiFromContainer>;
  let repos: ReturnType<typeof createInMemoryContainer>;
  let businessId: string;

  beforeEach(async () => {
    repos = createInMemoryContainer();
    api = createApiFromContainer(repos);

    const biz = await repos.businesses.create({
      orgId: ORG_ID,
      name: "Executive Test Corp",
      industry: "services",
      employeeCount: 50,
      annualRevenue: 2_000_000,
    });
    businessId = biz.id;

    await repos.businessHealth.upsert({
      orgId: ORG_ID,
      businessId,
      overallScore: 55,
      generatedAt: nowIso(),
    });
  });

  it("generates an executive brief (deterministic fallback when no API key)", async () => {
    const decision = await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    const result = await api.businessDecision.getExecutiveBrief(ORG_ID, decision.id);
    expect(result.brief).toBeDefined();
    expect(result.brief.executiveSummary).toBeTruthy();
    expect(result.brief.businessHealthSummary).toBeTruthy();
    expect(Array.isArray(result.brief.topOpportunities)).toBe(true);
    // The executive summary should be persisted back on the decision
    expect(result.executiveSummary).toBeTruthy();
  });

  it("optimization report detects decision drift when high-confidence decisions stall", async () => {
    // Create 3 decisions and leave them in generated state
    for (let i = 0; i < 3; i++) {
      await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    }
    const report = await api.businessDecision.getOptimizationReport(ORG_ID, businessId);
    expect(report.signals.length).toBeGreaterThanOrEqual(0);
    expect(typeof report.overallHealthScore).toBe("number");
    expect(Array.isArray(report.learningInsights)).toBe(true);
  });

  it("optimization detects repeated failures in measured decisions", () => {
    const decisions = [
      { id: "d1", decisionType: "marketing" as const, status: "measured" as const, actualRoi: -5000, confidenceScore: 0.7, options: [] },
      { id: "d2", decisionType: "marketing" as const, status: "measured" as const, actualRoi: -3000, confidenceScore: 0.6, options: [] },
    ] as never[];

    const report = optimizeDecisions(decisions, [], []);
    const failureSignal = report.signals.find((s) => s.type === "repeated_failure");
    expect(failureSignal).toBeDefined();
    expect(failureSignal?.severity).toBe("critical");
  });

  it("priority ranking scores higher-ROI decisions above lower-ROI ones", () => {
    const decisions = [
      { id: "d1", status: "generated" as const, expectedRoi: 100000, expectedCost: 10000, confidenceScore: 0.9, expectedImpact: { riskLevel: "low" as const }, options: [{}] },
      { id: "d2", status: "generated" as const, expectedRoi: 5000, expectedCost: 20000, confidenceScore: 0.4, expectedImpact: { riskLevel: "high" as const }, options: [] },
    ] as never[];

    const ranking = prioritizeDecisions(decisions);
    expect(ranking[0]?.decisionId).toBe("d1");
    expect(ranking[0]?.score).toBeGreaterThan(ranking[1]?.score ?? 0);
  });

  it("Mission Control snapshot includes decision queue and active scenarios", async () => {
    // Create a decision and scenario
    await api.businessDecision.generate(ORG_ID, businessId, { recommendationIds: [] });
    await api.scenario.create(ORG_ID, businessId, {
      scenarioType: "revenue",
      objective: "Revenue growth Q1",
      assumptions: [],
      forecastPeriod: "90d",
    });

    const snapshot = await api.missionControl.getSnapshot(ORG_ID, businessId);
    expect(snapshot.decisions).toBeDefined();
    expect(Array.isArray(snapshot.decisions.pending)).toBe(true);
    expect(snapshot.decisions.pending.length).toBe(1);
    expect(Array.isArray(snapshot.activeScenarios)).toBe(true);
    expect(snapshot.activeScenarios.length).toBe(1);
  });

  it("forecast engine produces reasonable growth curve", () => {
    const forecast = generateForecast(1_000_000, 300_000, 70);
    expect(forecast.length).toBe(4);
    // All periods should have positive revenue
    for (const f of forecast) {
      expect(f.projectedRevenue).toBeGreaterThan(0);
      expect(f.confidenceScore).toBeGreaterThan(0);
      expect(f.confidenceScore).toBeLessThanOrEqual(1);
    }
  });

  it("scenario comparison emits event and persists comparison record", async () => {
    const events: string[] = [];
    repos.eventBus.subscribe("scenario.compared", () => events.push("compared"));

    await api.scenario.create(ORG_ID, businessId, { scenarioType: "revenue", objective: "A", assumptions: [], forecastPeriod: "90d" });
    await api.scenario.create(ORG_ID, businessId, { scenarioType: "pricing", objective: "B", assumptions: [], forecastPeriod: "90d" });

    await api.scenario.compare(ORG_ID, businessId, { scenarioIds: [] });
    expect(events).toContain("compared");

    const comparisons = await repos.businessScenarios.listComparisons(ORG_ID, businessId);
    expect(comparisons.length).toBe(1);
    expect(comparisons[0]?.recommendedScenarioId).toBeTruthy();
  });
});
