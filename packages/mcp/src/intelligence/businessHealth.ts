import type { BusinessMriResponse, HealthDimensionKey, HealthStatus, HealthTrend } from "@boss/types";
import { healthDimensionRegistry, painPointRegistry } from "@boss/registries";
import { asBoolean, asNumber, asString, asStringArray, toResponseMap } from "./responseMap.js";

export interface DerivedHealthDimension {
  dimensionKey: HealthDimensionKey;
  score: number;
  confidence: number;
  trend: HealthTrend;
  evidence: string[];
  status: HealthStatus;
}

function statusFor(score: number): HealthStatus {
  if (score >= 80) return "strong";
  if (score >= 60) return "healthy";
  if (score >= 40) return "at_risk";
  return "critical";
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}

const SCALE_MAX = 5;

function scaleToScore(value: number): number {
  return clamp((value / SCALE_MAX) * 100);
}

/**
 * Deterministic, registry-driven Business Health scoring. Every dimension
 * score is a fixed function of specific MRI answers plus a penalty for
 * selected pain points mapped via painPointRegistry. No AI reasoning.
 */
export function deriveBusinessHealth(responses: BusinessMriResponse[]): DerivedHealthDimension[] {
  const map = toResponseMap(responses);
  const selectedPainPoints = asStringArray(map, "pain_points.challenges");

  const penaltyFor = (dimensionKey: HealthDimensionKey): { penalty: number; evidence: string[] } => {
    const evidence: string[] = [];
    let penalty = 0;
    for (const painPointKey of selectedPainPoints) {
      const painPoint = painPointRegistry.get(painPointKey);
      if (painPoint?.relatedHealthDimensions.includes(dimensionKey)) {
        penalty += 10;
        evidence.push(`Pain point reported: ${painPoint.label}`);
      }
    }
    return { penalty, evidence };
  };

  const dimensionScores: Record<Exclude<HealthDimensionKey, "overall">, { score: number; evidence: string[] }> = {
    sales: scoreSales(map),
    marketing: scoreMarketing(map),
    operations: scoreOperations(map),
    financial: scoreFinancial(map),
    customer_experience: scoreCustomerExperience(map),
    team_productivity: scoreTeamProductivity(map),
    technology: scoreTechnology(map),
    growth: scoreGrowth(map),
    ai_readiness: scoreAiReadiness(map),
  };

  const dimensions: DerivedHealthDimension[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const [dimensionKey, { score: rawScore, evidence }] of Object.entries(dimensionScores) as Array<
    [Exclude<HealthDimensionKey, "overall">, { score: number; evidence: string[] }]
  >) {
    const { penalty, evidence: painEvidence } = penaltyFor(dimensionKey);
    const score = clamp(rawScore - penalty);
    const allEvidence = [...evidence, ...painEvidence];
    const dimensionDef = healthDimensionRegistry.get(dimensionKey);
    const weight = dimensionDef?.weight ?? 0;
    weightedSum += score * weight;
    weightTotal += weight;

    dimensions.push({
      dimensionKey,
      score,
      confidence: Math.min(0.95, 0.6 + allEvidence.length * 0.05),
      trend: "unknown",
      evidence: allEvidence,
      status: statusFor(score),
    });
  }

  const overallScore = weightTotal > 0 ? clamp(weightedSum / weightTotal) : 0;
  dimensions.push({
    dimensionKey: "overall",
    score: overallScore,
    confidence: 0.7,
    trend: "unknown",
    evidence: ["Weighted composite of all dimensions."],
    status: statusFor(overallScore),
  });

  return dimensions;
}

function scoreSales(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const followUp = asString(map, "sales.follow_up_process");
  const base: Record<string, number> = { none: 20, manual: 50, semi_automated: 75, automated: 95 };
  const score = base[followUp] ?? 40;
  return { score: clamp(score), evidence: [`Follow-up process: ${followUp || "unknown"}`] };
}

function scoreMarketing(map: Map<string, unknown>): { score: number; evidence: string[] } {
  let score = 30;
  const evidence: string[] = [];
  if (asBoolean(map, "marketing.website")) {
    score += 20;
    evidence.push("Has a website");
  }
  const socials = asStringArray(map, "marketing.social_media").filter((s) => s !== "none");
  score += Math.min(socials.length * 7, 20);
  if (asBoolean(map, "marketing.email_marketing")) {
    score += 15;
    evidence.push("Runs email marketing");
  }
  score += scaleToScore(asNumber(map, "marketing.reviews")) * 0.15;
  if (asBoolean(map, "marketing.referral_programs")) {
    score += 10;
    evidence.push("Has a referral program");
  }
  return { score: clamp(score), evidence };
}

function scoreOperations(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const scheduling = asString(map, "operations.scheduling");
  const schedulingScore: Record<string, number> = { paper: 30, spreadsheet: 55, software: 85 };
  const teamResp = asString(map, "operations.team_responsibilities");
  const teamScore: Record<string, number> = { undefined: 20, informal: 50, documented: 85 };
  const docBonus = asBoolean(map, "operations.process_documentation") ? 10 : 0;
  const score = (schedulingScore[scheduling] ?? 40) * 0.4 + (teamScore[teamResp] ?? 40) * 0.4 + docBonus * 2;
  return { score: clamp(score), evidence: [`Scheduling: ${scheduling || "unknown"}`, `Team responsibilities: ${teamResp || "unknown"}`] };
}

function scoreFinancial(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const invoicing = asString(map, "finance.invoicing");
  const invoicingScore: Record<string, number> = { manual: 30, spreadsheet: 55, software: 85 };
  const collections = asString(map, "finance.collections");
  const collectionsScore: Record<string, number> = { informal: 30, manual_reminders: 55, automated: 85 };
  const visibility = scaleToScore(asNumber(map, "finance.cash_flow_visibility"));
  const score = (invoicingScore[invoicing] ?? 40) * 0.35 + (collectionsScore[collections] ?? 40) * 0.35 + visibility * 0.3;
  return { score: clamp(score), evidence: [`Invoicing: ${invoicing || "unknown"}`, `Collections: ${collections || "unknown"}`] };
}

function scoreCustomerExperience(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const repeat = scaleToScore(asNumber(map, "customers.repeat_business"));
  const reviews = scaleToScore(asNumber(map, "marketing.reviews"));
  return { score: clamp(repeat * 0.5 + reviews * 0.5), evidence: ["Repeat business and reviews scale"] };
}

function scoreTeamProductivity(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const dailyTasks = asString(map, "operations.daily_tasks");
  const taskScore: Record<string, number> = { informal: 30, checklist: 60, task_software: 85 };
  const teamResp = asString(map, "operations.team_responsibilities");
  const teamScore: Record<string, number> = { undefined: 20, informal: 50, documented: 85 };
  const score = (taskScore[dailyTasks] ?? 40) * 0.5 + (teamScore[teamResp] ?? 40) * 0.5;
  return { score: clamp(score), evidence: [`Daily task tracking: ${dailyTasks || "unknown"}`] };
}

function scoreTechnology(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const signals = [
    asBoolean(map, "technology.crm"),
    asBoolean(map, "technology.accounting_software"),
    asBoolean(map, "technology.calendar"),
    asString(map, "technology.phone") === "voip_system",
    asString(map, "technology.email") === "business_domain",
    asBoolean(map, "technology.existing_ai_usage"),
  ].filter(Boolean).length;
  return { score: clamp((signals / 6) * 100), evidence: [`${signals}/6 technology signals present`] };
}

function scoreGrowth(map: Map<string, unknown>): { score: number; evidence: string[] } {
  const years = asNumber(map, "identity.years_operating");
  const score = years < 1 ? 40 : years < 3 ? 60 : years < 8 ? 75 : 85;
  return { score: clamp(score), evidence: [`Years operating: ${years}`] };
}

function scoreAiReadiness(map: Map<string, unknown>): { score: number; evidence: string[] } {
  if (asBoolean(map, "technology.existing_ai_usage")) {
    return { score: 80, evidence: ["Already using AI tools"] };
  }
  if (asBoolean(map, "technology.crm") || asBoolean(map, "technology.accounting_software")) {
    return { score: 40, evidence: ["Has foundational software tooling"] };
  }
  return { score: 15, evidence: ["No structured tooling reported"] };
}
