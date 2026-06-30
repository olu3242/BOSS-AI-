import type { BusinessDecision } from "@boss/types";
import { verificationRegistry } from "@boss/registries";
import type { KpiReading } from "./kpiDerivation.js";

export type VerificationStatus = "success" | "partial" | "failure" | "insufficient_data";

export interface KpiDelta {
  kpiKey: string;
  label: string;
  baselineValue: number | null;
  currentValue: number | null;
  deltaPct: number | null;
  metThreshold: boolean;
}

export interface VerificationResult {
  decisionId: string;
  verificationKey: string;
  status: VerificationStatus;
  confidence: number;
  kpiDeltas: KpiDelta[];
  summary: string;
  verifiedAt: string;
}

function computeDeltaPct(baseline: number | null, current: number | null): number | null {
  if (baseline === null || current === null || baseline === 0) return null;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

function selectVerificationKey(decision: BusinessDecision): string {
  const type = decision.decisionType ?? "operational";
  const map: Record<string, string> = {
    strategic: "revenue_kpi_verification",
    financial: "roi_comparison_verification",
    marketing: "revenue_kpi_verification",
    operational: "workflow_completion_verification",
    technology: "composite_health_verification",
    customer_retention: "retention_rate_verification",
  };
  return map[type] ?? "composite_health_verification";
}

export function verifyOutcome(
  decision: BusinessDecision,
  baselineReadings: KpiReading[],
  currentReadings: KpiReading[],
  verifiedAt: string
): VerificationResult {
  const verificationKey = selectVerificationKey(decision);
  const template = verificationRegistry.get(verificationKey);

  if (!template) {
    return {
      decisionId: decision.id,
      verificationKey,
      status: "insufficient_data",
      confidence: 0,
      kpiDeltas: [],
      summary: `No verification template found for key: ${verificationKey}.`,
      verifiedAt,
    };
  }

  const baselineMap = new Map(baselineReadings.map((r) => [r.kpiKey, r]));
  const currentMap = new Map(currentReadings.map((r) => [r.kpiKey, r]));

  const primaryBaseline = baselineMap.get(template.primaryKpiKey);
  const primaryCurrent = currentMap.get(template.primaryKpiKey);

  const primaryDelta = computeDeltaPct(primaryBaseline?.value ?? null, primaryCurrent?.value ?? null);
  const primaryMet = primaryDelta !== null && primaryDelta >= template.successThresholdPct;

  const allKpiKeys = [...new Set([...baselineMap.keys(), ...currentMap.keys()])];
  const kpiDeltas: KpiDelta[] = allKpiKeys.map((key) => {
    const base = baselineMap.get(key);
    const curr = currentMap.get(key);
    const delta = computeDeltaPct(base?.value ?? null, curr?.value ?? null);
    return {
      kpiKey: key,
      label: base?.label ?? curr?.label ?? key,
      baselineValue: base?.value ?? null,
      currentValue: curr?.value ?? null,
      deltaPct: delta,
      metThreshold: key === template.primaryKpiKey
        ? primaryMet
        : delta !== null && delta >= 0,
    };
  });

  const hasData =
    primaryBaseline !== undefined &&
    primaryCurrent !== undefined &&
    (primaryBaseline.value !== null || primaryCurrent.value !== null);
  if (!hasData) {
    return {
      decisionId: decision.id,
      verificationKey,
      status: "insufficient_data",
      confidence: 0,
      kpiDeltas,
      summary: `Insufficient data to verify ${template.label}. Baseline or current readings missing.`,
      verifiedAt,
    };
  }

  const confidence = Math.min(template.minConfidence + (primaryMet ? 0.1 : 0), 1.0);
  const status: VerificationStatus =
    primaryMet ? "success" :
    primaryDelta !== null && primaryDelta > 0 ? "partial" : "failure";

  const summary =
    status === "success"
      ? `${template.label} passed — ${template.primaryKpiKey} improved by ${primaryDelta?.toFixed(1)}% (threshold: ${template.successThresholdPct}%).`
      : status === "partial"
      ? `${template.label} partially met — ${template.primaryKpiKey} improved by ${primaryDelta?.toFixed(1)}% but below ${template.successThresholdPct}% threshold.`
      : `${template.label} failed — ${template.primaryKpiKey} did not improve (delta: ${primaryDelta?.toFixed(1) ?? "N/A"}%).`;

  return {
    decisionId: decision.id,
    verificationKey,
    status,
    confidence,
    kpiDeltas,
    summary,
    verifiedAt,
  };
}
