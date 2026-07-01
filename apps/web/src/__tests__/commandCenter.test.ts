import { describe, expect, it } from "vitest";
import { createDemoCommandCenter } from "../demoCommandCenter.js";

describe("BOSS command center", () => {
  it("renders an end-to-end dashboard from the real API workflow", async () => {
    const { snapshot, html } = await createDemoCommandCenter();

    expect(snapshot.summary.businessName).toBe("Lakeside HVAC");
    expect(snapshot.metrics.map((metric) => metric.label)).toContain("Business Health");
    expect(snapshot.metrics.map((metric) => metric.label)).toContain("Projected Annual Profit");
    expect(snapshot.alerts.length).toBeGreaterThan(0);
    expect(snapshot.agents.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.automation.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.drillDowns.map((view) => view.title)).toContain("Transformation Roadmap");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("BOSS Command Center");
    expect(html).toContain("Executive KPIs");
    expect(html).toContain("AI Agent Status");
  });
});
