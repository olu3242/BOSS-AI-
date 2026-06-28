import { describe, expect, it } from "vitest";
import type { BusinessDiagnosticReport } from "@boss/types";
import { buildDiagnosticDashboard } from "../diagnosticDashboard.js";

describe("diagnostic dashboard projection", () => {
  it("derives every view from the persisted report", () => {
    const report = {
      id: "report-1",
      generatedAt: "2026-06-27T12:00:00.000Z",
      overallHealth: 54,
      confidence: 0.78,
      areaScores: [
        {
          area: "operations",
          currentScore: 40,
          desiredScore: 80,
          gap: 40,
          trend: "unknown",
          confidence: 0.8,
          businessImpact: 40,
          priority: 32,
          evidence: [],
          recommendedImprovement: "Document the scheduling process",
        },
      ],
      rootCauses: [
        {
          id: "constraint-1",
          constraintId: "constraint-1",
          area: "operations",
          kind: "primary",
          title: "Manual scheduling",
          description: "Scheduling depends on spreadsheets.",
          businessImpact: "Missed appointments",
          confidence: 0.8,
          dependencies: [],
          evidence: [],
        },
      ],
      opportunities: [
        {
          id: "recommendation-1",
          recommendationId: "recommendation-1",
          type: "quick_win",
          title: "Add appointment reminders",
          description: "Reduce missed appointments.",
          expectedImpact: 70,
          effort: 25,
          confidence: 0.8,
          priority: 95,
          evidence: [],
        },
      ],
      maturity: [],
      priorities: [
        {
          sourceType: "root_cause",
          sourceId: "constraint-1",
          impact: 85,
          urgency: 75,
          effort: 50,
          confidence: 0.8,
          score: 64,
          rank: 1,
        },
      ],
      summary: {
        overview: "Operations needs immediate attention.",
      },
    } as unknown as BusinessDiagnosticReport;

    const dashboard = buildDiagnosticDashboard(report);

    expect(dashboard.overallHealth).toBe(54);
    expect(dashboard.priorityIssues[0]?.title).toBe("Manual scheduling");
    expect(dashboard.recommendedNextStep).toBe("Add appointment reminders");
    expect(dashboard.executiveOverview).toBe(
      "Operations needs immediate attention.",
    );
  });
});
