import { describe, it, expect } from "vitest";
import { metricRegistry } from "../registries/metric.js";
import { insightRegistry } from "../registries/insight.js";

describe("Platform metric registry seeds", () => {
  it("has at least one entry per canonical KPI key", () => {
    const metrics = metricRegistry.list();
    expect(metrics.length).toBeGreaterThanOrEqual(11);

    const kpiKeys = metrics.filter((m) => m.kpiKey).map((m) => m.kpiKey!);
    expect(kpiKeys).toContain("business_health_score");
    expect(kpiKeys).toContain("ai_adoption_score");
    expect(kpiKeys).toContain("administrative_hours");
    expect(kpiKeys).toContain("revenue");
    expect(kpiKeys).toContain("profit_margin");
    expect(kpiKeys).toContain("customer_retention");
  });

  it("has no duplicate keys in metric registry", () => {
    const keys = metricRegistry.list().map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("Platform insight registry seeds", () => {
  it("has platform insight entries across all categories", () => {
    const insights = insightRegistry.list();
    expect(insights.length).toBeGreaterThanOrEqual(10);

    const categories = new Set(insights.map((i) => i.category));
    expect(categories.has("health")).toBe(true);
    expect(categories.has("efficiency")).toBe(true);
    expect(categories.has("risk")).toBe(true);
    expect(categories.has("opportunity")).toBe(true);
    expect(categories.has("performance")).toBe(true);
  });

  it("all actionable insights have related KPI keys", () => {
    const actionable = insightRegistry.list().filter((i) => i.actionable);
    for (const insight of actionable) {
      expect(insight.relatedKpiKeys.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate keys in insight registry", () => {
    const keys = insightRegistry.list().map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
