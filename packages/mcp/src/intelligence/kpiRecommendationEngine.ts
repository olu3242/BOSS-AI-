import { recommendationDefinitionRegistry } from "@boss/registries";
import type { KpiReading } from "./kpiDerivation.js";
import type { GeneratedRecommendation } from "./recommendationEngine.js";
import type { RecommendationEvidenceItem } from "@boss/types";

/**
 * KPI thresholds that trigger recommendations when breached.
 * Each entry maps a KPI key to a condition and the recommendation definition
 * keys that should fire. This keeps derivation logic in MCP (Law 1) and
 * complements the constraint-driven engine without replacing it.
 */
interface KpiThreshold {
  kpiKey: string;
  label: string;
  condition: (value: number) => boolean;
  triggerDefinitionKeys: string[];
  evidenceTemplate: (value: number, unit: string) => string;
  confidence: number;
}

const KPI_THRESHOLDS: KpiThreshold[] = [
  {
    kpiKey: "lead_response_time",
    label: "Slow Lead Response",
    condition: (v) => v > 60,
    triggerDefinitionKeys: ["lead_follow_up_recovery"],
    evidenceTemplate: (v, u) => `Lead response time is ${v.toFixed(0)} ${u}, exceeding the 60-minute target. Slow response reduces conversion probability.`,
    confidence: 0.85,
  },
  {
    kpiKey: "customer_retention",
    label: "Customer Retention Risk",
    condition: (v) => v < 70,
    triggerDefinitionKeys: ["customer_re_engagement"],
    evidenceTemplate: (v, u) => `Customer retention rate is ${v.toFixed(1)}${u}, below the 70% healthy threshold. Risk of revenue churn.`,
    confidence: 0.8,
  },
  {
    kpiKey: "review_rating",
    label: "Low Review Rating",
    condition: (v) => v < 4.0,
    triggerDefinitionKeys: ["review_request_campaign"],
    evidenceTemplate: (v, u) => `Average review rating is ${v.toFixed(1)} ${u}, below the 4.0 threshold that drives organic acquisition.`,
    confidence: 0.75,
  },
  {
    kpiKey: "outstanding_invoices",
    label: "High Outstanding Invoices",
    condition: (v) => v > 5000,
    triggerDefinitionKeys: ["invoice_follow_up_automation"],
    evidenceTemplate: (v, u) => `Outstanding invoices total ${v.toFixed(0)} ${u}. Cash flow is at risk if invoices are not followed up promptly.`,
    confidence: 0.9,
  },
  {
    kpiKey: "administrative_hours",
    label: "High Administrative Hours",
    condition: (v) => v > 20,
    triggerDefinitionKeys: ["appointment_reminder_automation"],
    evidenceTemplate: (v, u) => `Administrative work consumes ${v.toFixed(0)} ${u} per week. Automation can reclaim significant owner time.`,
    confidence: 0.8,
  },
  {
    kpiKey: "ai_adoption_score",
    label: "Low AI Adoption",
    condition: (v) => v < 40,
    triggerDefinitionKeys: ["appointment_reminder_automation"],
    evidenceTemplate: (v, u) => `AI adoption score is ${v.toFixed(0)}${u}. Less than half of available automation capabilities are in active use.`,
    confidence: 0.7,
  },
  {
    kpiKey: "profit_margin",
    label: "Low Profit Margin",
    condition: (v) => v < 10,
    triggerDefinitionKeys: ["invoice_follow_up_automation", "lead_follow_up_recovery"],
    evidenceTemplate: (v, u) => `Profit margin is ${v.toFixed(1)}${u}, below the 10% healthy threshold. Revenue and cost levers need attention.`,
    confidence: 0.8,
  },
];

/**
 * Derives recommendation candidates from KPI readings that breach configured
 * thresholds. Complements the constraint-driven engine — fires even when no
 * named constraint has been formally registered for the KPI signal.
 *
 * Only fires for readings with non-null values. Uses the existing
 * recommendationDefinitionRegistry so no recommendation logic is duplicated.
 */
export function deriveKpiRecommendations(
  readings: KpiReading[],
  employeeCount = 5,
): GeneratedRecommendation[] {
  const readingsByKey = new Map(readings.filter((r) => r.value !== null).map((r) => [r.kpiKey, r]));
  const sizeFactor = Math.max(1, Math.min(3, employeeCount / 5));
  const allDefinitions = recommendationDefinitionRegistry.list();
  const definitionByKey = new Map(allDefinitions.map((d) => [d.definitionKey ?? d.key, d]));

  const fired = new Set<string>();
  const candidates: GeneratedRecommendation[] = [];

  for (const threshold of KPI_THRESHOLDS) {
    const reading = readingsByKey.get(threshold.kpiKey);
    if (!reading || reading.value === null) continue;
    if (!threshold.condition(reading.value)) continue;

    for (const defKey of threshold.triggerDefinitionKeys) {
      if (fired.has(defKey)) continue;
      const definition = definitionByKey.get(defKey);
      if (!definition) continue;

      fired.add(defKey);

      const evidenceText = threshold.evidenceTemplate(reading.value, reading.unit);
      const evidence: RecommendationEvidenceItem[] = [
        {
          source: "kpi_reading",
          description: evidenceText,
          data: {
            kpiKey: reading.kpiKey,
            value: reading.value,
            unit: reading.unit,
            trend: reading.trend,
            measuredAt: reading.measuredAt,
          },
        },
      ];

      const roiModel = definition.roiModel;
      candidates.push({
        definitionKey: definition.definitionKey ?? definition.key,
        title: definition.title,
        description: definition.description,
        businessGoal: definition.businessGoal,
        category: definition.category,
        relatedCapabilities: definition.relatedCapabilities,
        relatedConstraintIds: [],
        relatedKpiKeys: definition.relatedKpiKeys,
        expectedOutcome: definition.expectedOutcome,
        difficulty: definition.difficulty,
        estimatedEffortHours: Math.round(definition.estimatedEffortHoursBase * sizeFactor),
        estimatedCost: Math.round(definition.estimatedCostBase * sizeFactor),
        estimatedRoi: {
          revenueIncreaseAnnual: Math.round(roiModel.revenueIncreaseAnnualBase * sizeFactor),
          timeSavedHoursWeekly: roiModel.timeSavedHoursWeeklyBase,
          administrativeReductionHours: roiModel.administrativeReductionHoursBase,
          customerRetentionIncreasePct: roiModel.customerRetentionIncreasePct,
          leadConversionImprovementPct: roiModel.leadConversionImprovementPct,
          profitImpactAnnual: Math.round(roiModel.profitImpactAnnualBase * sizeFactor),
          ownerTimeSavedHoursWeekly: roiModel.ownerTimeSavedHoursWeeklyBase,
          riskReduction: roiModel.riskReduction,
          confidence: threshold.confidence,
        },
        estimatedTimeToValueDays: definition.estimatedTimeToValueDaysBase,
        confidence: threshold.confidence,
        evidence,
        dependencies: definition.relatedCapabilities,
        approval: definition.approval,
        stage: definition.stage,
      });
    }
  }

  return candidates;
}
