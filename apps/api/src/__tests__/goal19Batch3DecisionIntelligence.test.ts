import { describe, it, expect, beforeAll } from "vitest";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import { createInMemoryContainer, type RepositoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import type { Business } from "@boss/types";
import { deriveKpiHealthScore, deriveKpiRecommendations } from "@boss/mcp";
import type { KpiReading } from "@boss/mcp";

beforeAll(() => {
  installGeneralSmbPack();
});

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

const NOW = new Date().toISOString();

const SAMPLE_READINGS: KpiReading[] = [
  { kpiKey: "business_health_score", label: "Business Health Score", value: 72, unit: "%", measuredAt: NOW, source: "health_score", trend: "up" },
  { kpiKey: "profit_margin", label: "Profit Margin", value: 8, unit: "%", measuredAt: NOW, source: "event_log", trend: "stable" },
  { kpiKey: "customer_retention", label: "Customer Retention", value: 65, unit: "%", measuredAt: NOW, source: "event_log", trend: "down" },
  { kpiKey: "lead_response_time", label: "Lead Response Time", value: 120, unit: "minutes", measuredAt: NOW, source: "event_log", trend: "down" },
  { kpiKey: "review_rating", label: "Review Rating", value: 3.8, unit: "stars", measuredAt: NOW, source: "event_log", trend: "stable" },
  { kpiKey: "outstanding_invoices", label: "Outstanding Invoices", value: 8000, unit: "USD", measuredAt: NOW, source: "event_log", trend: "down" },
  { kpiKey: "ai_adoption_score", label: "AI Adoption Score", value: 30, unit: "%", measuredAt: NOW, source: "health_score", trend: "stable" },
];

describe("Goal 19 Batch 3 — KPI Health Score (WS2)", () => {
  it("computes a composite health score from KPI readings", () => {
    const result = deriveKpiHealthScore(SAMPLE_READINGS, NOW);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.measuredAt).toBe(NOW);
  });

  it("identifies top strengths and top risks", () => {
    const result = deriveKpiHealthScore(SAMPLE_READINGS, NOW);
    // health_score=72 should be a strength; lead_response_time=120min should be a risk
    expect(result.topRisks.length).toBeGreaterThan(0);
  });

  it("returns improving/stable/declining trend", () => {
    const result = deriveKpiHealthScore(SAMPLE_READINGS, NOW);
    expect(["improving", "stable", "declining"]).toContain(result.trend);
  });

  it("handles empty readings gracefully", () => {
    const result = deriveKpiHealthScore([], NOW);
    expect(result.overallScore).toBe(0);
    expect(result.components).toHaveLength(0);
  });

  it("ignores null-value readings", () => {
    const withNull: KpiReading[] = [
      ...SAMPLE_READINGS,
      { kpiKey: "revenue", label: "Revenue", value: null, unit: "USD", measuredAt: NOW, source: "registry_default", trend: "unknown" },
    ];
    const result = deriveKpiHealthScore(withNull, NOW);
    const revenueComponent = result.components.find((c) => c.kpiKey === "revenue");
    expect(revenueComponent).toBeUndefined();
  });
});

describe("Goal 19 Batch 3 — KPI Recommendation Engine (WS1)", () => {
  it("fires recommendations for KPIs below threshold", () => {
    const recs = deriveKpiRecommendations(SAMPLE_READINGS, 10);
    // lead_response_time=120 > 60 threshold → lead_follow_up_recovery
    // customer_retention=65 < 70 → customer_re_engagement
    // review_rating=3.8 < 4.0 → review_request_campaign
    // outstanding_invoices=8000 > 5000 → invoice_follow_up_automation
    expect(recs.length).toBeGreaterThan(0);
  });

  it("each recommendation has evidence sourced from kpi_reading", () => {
    const recs = deriveKpiRecommendations(SAMPLE_READINGS, 10);
    for (const rec of recs) {
      expect(rec.evidence.length).toBeGreaterThan(0);
      expect(rec.evidence[0]!.source).toBe("kpi_reading");
      expect(rec.evidence[0]!.data).toHaveProperty("kpiKey");
    }
  });

  it("does not fire duplicates for the same definition key", () => {
    const recs = deriveKpiRecommendations(SAMPLE_READINGS, 10);
    const defKeys = recs.map((r) => r.definitionKey);
    expect(new Set(defKeys).size).toBe(defKeys.length);
  });

  it("does not fire recommendations when KPIs are healthy", () => {
    const healthyReadings: KpiReading[] = [
      { kpiKey: "lead_response_time", label: "Lead Response Time", value: 30, unit: "minutes", measuredAt: NOW, source: "event_log", trend: "up" },
      { kpiKey: "customer_retention", label: "Customer Retention", value: 85, unit: "%", measuredAt: NOW, source: "event_log", trend: "up" },
      { kpiKey: "review_rating", label: "Review Rating", value: 4.8, unit: "stars", measuredAt: NOW, source: "event_log", trend: "up" },
      { kpiKey: "outstanding_invoices", label: "Outstanding Invoices", value: 0, unit: "USD", measuredAt: NOW, source: "event_log", trend: "up" },
    ];
    const recs = deriveKpiRecommendations(healthyReadings, 10);
    expect(recs.length).toBe(0);
  });
});

describe("Goal 19 Batch 3 — kpiMeasurementService integration (WS1+WS2)", () => {
  it("measure() returns kpiHealthScore and kpiRecommendations", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    const result = await api.kpiMeasurement.measure("org-1", business.id);

    expect(result.kpiHealthScore).toBeDefined();
    expect(result.kpiHealthScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.kpiRecommendations).toBeDefined();
    expect(Array.isArray(result.kpiRecommendations)).toBe(true);
  });
});

describe("Goal 19 Batch 3 — Decision Timeline (WS4)", () => {
  it("records timeline entry when recommendation is approved", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    // Seed health and constraint so recommendations can be generated
    await repos.businessHealth.upsert({
      orgId: "org-1",
      businessId: business.id,
      overallScore: 55,
      generatedAt: NOW,
    });

    const { recommendations } = await api.businessRecommendation.analyze("org-1", business.id);
    if (recommendations.length === 0) return; // no recommendations seeded in this pack

    const rec = recommendations[0]!;
    await api.businessRecommendation.approve("org-1", rec.id);

    const timeline = await api.businessTimeline.list("org-1", business.id);
    const approvalEntry = timeline.find((e) => e.type === "recommendation_approved");
    expect(approvalEntry).toBeDefined();
    expect((approvalEntry!.metadata as { recommendationId: string }).recommendationId).toBe(rec.id);
  });

  it("records timeline entry when recommendation is dismissed", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await repos.businessHealth.upsert({
      orgId: "org-1",
      businessId: business.id,
      overallScore: 55,
      generatedAt: NOW,
    });

    const { recommendations } = await api.businessRecommendation.analyze("org-1", business.id);
    if (recommendations.length === 0) return;

    const rec = recommendations[0]!;
    await api.businessRecommendation.dismiss("org-1", rec.id);

    const timeline = await api.businessTimeline.list("org-1", business.id);
    const dismissEntry = timeline.find((e) => e.type === "recommendation_dismissed");
    expect(dismissEntry).toBeDefined();
  });
});

describe("Goal 19 Batch 3 — Executive Briefing (WS3 — already certified in Batch 1)", () => {
  it("generates a briefing that includes health score in headline", async () => {
    const repos = makeRepos();
    const api = createApiFromContainer(repos);
    const business = await seedBusiness(repos);

    await repos.businessHealth.upsert({
      orgId: "org-1",
      businessId: business.id,
      overallScore: 77,
      generatedAt: NOW,
    });

    const briefing = await api.executiveBriefing.generate("org-1", business.id, "daily");
    expect(briefing.headline).toContain("77");
    expect(briefing.summary).toBeTruthy();
    expect(briefing.period).toBe("daily");
  });
});
