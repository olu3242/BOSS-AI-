import { describe, expect, it, beforeAll } from "vitest";
import { healthDimensionRegistry, painPointRegistry } from "@boss/registries";
import { deriveBusinessHealth } from "../intelligence/businessHealth.js";
import { sampleResponses } from "./fixtures.js";

beforeAll(() => {
  const dimensions = [
    { key: "sales", dimensionKey: "sales" as const, label: "Sales Health", description: "", weight: 0.15 },
    { key: "marketing", dimensionKey: "marketing" as const, label: "Marketing Health", description: "", weight: 0.1 },
    { key: "operations", dimensionKey: "operations" as const, label: "Operations Health", description: "", weight: 0.15 },
    { key: "financial", dimensionKey: "financial" as const, label: "Financial Health", description: "", weight: 0.15 },
    { key: "customer_experience", dimensionKey: "customer_experience" as const, label: "Customer Experience", description: "", weight: 0.1 },
    { key: "team_productivity", dimensionKey: "team_productivity" as const, label: "Team Productivity", description: "", weight: 0.1 },
    { key: "technology", dimensionKey: "technology" as const, label: "Technology Health", description: "", weight: 0.1 },
    { key: "growth", dimensionKey: "growth" as const, label: "Growth Health", description: "", weight: 0.1 },
    { key: "ai_readiness", dimensionKey: "ai_readiness" as const, label: "AI Readiness", description: "", weight: 0.05 },
    { key: "overall", dimensionKey: "overall" as const, label: "Overall Business Health", description: "", weight: 0 },
  ];
  for (const dimension of dimensions) {
    if (!healthDimensionRegistry.get(dimension.key)) healthDimensionRegistry.register(dimension);
  }

  const painPoints = [
    { key: "missed_leads", label: "Missed Leads", relatedHealthDimensions: ["sales", "marketing"] },
    { key: "outstanding_invoices", label: "Outstanding Invoices", relatedHealthDimensions: ["financial"] },
  ];
  for (const painPoint of painPoints) {
    if (!painPointRegistry.get(painPoint.key)) painPointRegistry.register(painPoint);
  }
});

describe("deriveBusinessHealth", () => {
  it("derives all 10 dimensions including overall", () => {
    const dimensions = deriveBusinessHealth(sampleResponses);
    const keys = dimensions.map((d) => d.dimensionKey);

    expect(keys).toEqual(
      expect.arrayContaining([
        "sales",
        "marketing",
        "operations",
        "financial",
        "customer_experience",
        "team_productivity",
        "technology",
        "growth",
        "ai_readiness",
        "overall",
      ]),
    );
    expect(dimensions).toHaveLength(10);
  });

  it("every score is within 0-100 and has a valid status", () => {
    const dimensions = deriveBusinessHealth(sampleResponses);
    for (const dimension of dimensions) {
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(100);
      expect(["strong", "healthy", "at_risk", "critical"]).toContain(dimension.status);
    }
  });

  it("applies pain point penalties as evidence", () => {
    const dimensions = deriveBusinessHealth(sampleResponses);
    const sales = dimensions.find((d) => d.dimensionKey === "sales");
    expect(sales?.evidence.some((e) => e.includes("Missed Leads"))).toBe(true);
  });
});
