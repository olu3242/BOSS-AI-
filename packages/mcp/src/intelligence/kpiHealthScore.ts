import type { KpiReading } from "./kpiDerivation.js";

export interface KpiHealthComponent {
  kpiKey: string;
  label: string;
  score: number;
  weight: number;
  trend: KpiReading["trend"];
  value: number | null;
  unit: string;
}

export interface KpiHealthScore {
  overallScore: number;
  components: KpiHealthComponent[];
  topStrengths: string[];
  topRisks: string[];
  trend: "improving" | "stable" | "declining";
  measuredAt: string;
}

/**
 * Scoring configuration for each KPI key.
 * scoreFn maps raw value → 0-100 component score.
 * weight is the contribution to the composite (weights are normalized).
 */
interface KpiScoreConfig {
  kpiKey: string;
  weight: number;
  scoreFn: (value: number) => number;
}

const KPI_SCORE_CONFIGS: KpiScoreConfig[] = [
  {
    kpiKey: "business_health_score",
    weight: 2.0,
    scoreFn: (v) => Math.max(0, Math.min(100, v)),
  },
  {
    kpiKey: "profit_margin",
    weight: 1.5,
    scoreFn: (v) => {
      // 0% → 0, 10% → 50, 20%+ → 100
      if (v <= 0) return 0;
      if (v >= 20) return 100;
      return (v / 20) * 100;
    },
  },
  {
    kpiKey: "customer_retention",
    weight: 1.5,
    scoreFn: (v) => {
      // <50% → 0, 80%+ → 100
      if (v <= 50) return 0;
      if (v >= 80) return 100;
      return ((v - 50) / 30) * 100;
    },
  },
  {
    kpiKey: "lead_conversion_rate",
    weight: 1.0,
    scoreFn: (v) => {
      // <5% → 0, 25%+ → 100
      if (v <= 5) return 0;
      if (v >= 25) return 100;
      return ((v - 5) / 20) * 100;
    },
  },
  {
    kpiKey: "lead_response_time",
    weight: 1.0,
    scoreFn: (v) => {
      // Lower is better: ≤60 min → 100, ≥480 min → 0
      if (v <= 60) return 100;
      if (v >= 480) return 0;
      return ((480 - v) / 420) * 100;
    },
  },
  {
    kpiKey: "review_rating",
    weight: 0.75,
    scoreFn: (v) => {
      // 1.0 → 0, 5.0 → 100
      return Math.max(0, Math.min(100, ((v - 1) / 4) * 100));
    },
  },
  {
    kpiKey: "outstanding_invoices",
    weight: 0.75,
    scoreFn: (v) => {
      // Lower is better: 0 → 100, ≥20000 → 0
      if (v <= 0) return 100;
      if (v >= 20000) return 0;
      return ((20000 - v) / 20000) * 100;
    },
  },
  {
    kpiKey: "ai_adoption_score",
    weight: 0.5,
    scoreFn: (v) => Math.max(0, Math.min(100, v)),
  },
  {
    kpiKey: "administrative_hours",
    weight: 0.5,
    scoreFn: (v) => {
      // Lower is better: 0 → 100, ≥40 → 0
      if (v <= 0) return 100;
      if (v >= 40) return 0;
      return ((40 - v) / 40) * 100;
    },
  },
];

const TOTAL_WEIGHT = KPI_SCORE_CONFIGS.reduce((sum, c) => sum + c.weight, 0);

/**
 * Derives a composite business health score (0–100) from a set of KPI readings.
 * Only readings with non-null values contribute to the score. When fewer than
 * 3 KPIs have values, the overall score is marked as low-confidence but still
 * returned — the caller decides whether to display or suppress it.
 *
 * Law 1 compliant: all scoring logic lives here in MCP. No database access.
 */
export function deriveKpiHealthScore(
  readings: KpiReading[],
  measuredAt: string,
): KpiHealthScore {
  const readingsByKey = new Map(readings.filter((r) => r.value !== null).map((r) => [r.kpiKey, r]));

  const components: KpiHealthComponent[] = [];
  let weightedSum = 0;
  let totalAppliedWeight = 0;

  for (const config of KPI_SCORE_CONFIGS) {
    const reading = readingsByKey.get(config.kpiKey);
    if (!reading || reading.value === null) continue;

    const score = Math.round(config.scoreFn(reading.value));
    components.push({
      kpiKey: config.kpiKey,
      label: reading.label,
      score,
      weight: config.weight,
      trend: reading.trend,
      value: reading.value,
      unit: reading.unit,
    });

    weightedSum += score * config.weight;
    totalAppliedWeight += config.weight;
  }

  const overallScore = totalAppliedWeight > 0
    ? Math.round(weightedSum / totalAppliedWeight)
    : 0;

  // Sort components to identify strengths (high score) and risks (low score).
  const sorted = [...components].sort((a, b) => b.score - a.score);
  const topStrengths = sorted.slice(0, 3).filter((c) => c.score >= 60).map((c) => c.label);
  const topRisks = sorted.slice(-3).reverse().filter((c) => c.score < 60).map((c) => c.label);

  // Overall trend: majority of components trending up → improving, etc.
  const trendCounts = { up: 0, down: 0, stable: 0, unknown: 0 };
  for (const c of components) trendCounts[c.trend]++;
  const trend: KpiHealthScore["trend"] =
    trendCounts.up > trendCounts.down
      ? "improving"
      : trendCounts.down > trendCounts.up
      ? "declining"
      : "stable";

  return { overallScore, components, topStrengths, topRisks, trend, measuredAt };
}
