import type {
  BusinessDiagnosticReport,
  DiagnosticAreaScore,
  DiagnosticMaturityAssessment,
  DiagnosticOpportunity,
  DiagnosticRootCause,
} from "@boss/types";

export interface DiagnosticDashboardSnapshot {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly overallHealth: number;
  readonly confidence: number;
  readonly categoryHealth: readonly DiagnosticAreaScore[];
  readonly priorityIssues: readonly DiagnosticRootCause[];
  readonly opportunities: readonly DiagnosticOpportunity[];
  readonly maturity: readonly DiagnosticMaturityAssessment[];
  readonly recommendedNextStep: string;
  readonly executiveOverview: string;
}

export function buildDiagnosticDashboard(
  report: BusinessDiagnosticReport,
): DiagnosticDashboardSnapshot {
  const rootRank = new Map(
    report.priorities
      .filter((item) => item.sourceType === "root_cause")
      .map((item) => [item.sourceId, item.rank]),
  );
  return Object.freeze({
    reportId: report.id,
    generatedAt: report.generatedAt,
    overallHealth: report.overallHealth,
    confidence: report.confidence,
    categoryHealth: Object.freeze(
      [...report.areaScores].sort(
        (left, right) => right.priority - left.priority,
      ),
    ),
    priorityIssues: Object.freeze(
      [...report.rootCauses]
        .sort(
          (left, right) =>
            (rootRank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
            (rootRank.get(right.id) ?? Number.MAX_SAFE_INTEGER),
        )
        .slice(0, 5),
    ),
    opportunities: Object.freeze(
      [...report.opportunities]
        .sort((left, right) => right.priority - left.priority)
        .slice(0, 6),
    ),
    maturity: Object.freeze([...report.maturity]),
    recommendedNextStep:
      report.opportunities[0]?.title ??
      report.areaScores
        .slice()
        .sort((left, right) => right.priority - left.priority)[0]
        ?.recommendedImprovement ??
      "Complete the remaining business discovery questions.",
    executiveOverview: report.summary.overview,
  });
}
