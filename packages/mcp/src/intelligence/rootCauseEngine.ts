/**
 * @owner   BTE / Operating Loop (automated causal analysis)
 * @trigger Automated — BTE Analyze phase only
 * @output  RootCauseChain for decision engine input
 * @note    Distinct from diagnosticEngine: produces causal chain, not a full diagnostic report.
 *          diagnosticEngine is for user-initiated structured sessions.
 */
import type { BusinessConstraint, BusinessHealth, BusinessRecommendation } from "@boss/types";

export interface CausalLink {
  symptom: string;
  cause: string;
  evidence: string[];
  confidence: number;
}

export interface RootCauseChain {
  rootCauseKey: string;
  rootCauseLabel: string;
  symptomChain: CausalLink[];
  recommendedActions: string[];
  severity: "low" | "medium" | "high" | "critical";
  affectedKpiKeys: string[];
  confidence: number;
}

export interface RootCauseAnalysisResult {
  chains: RootCauseChain[];
  primaryRootCause: string | null;
  summary: string;
  detectedAt: string;
}

/**
 * Known causal relationships between constraint definition keys and their root drivers.
 * All analysis is deterministic — no LLM reasoning (Law 1 compliance).
 * Format: constraintKey → { root, chain, affectedKpis }
 */
const CAUSAL_MAP: Record<string, {
  root: string;
  rootLabel: string;
  chainLinks: Array<{ symptom: string; cause: string }>;
  affectedKpiKeys: string[];
}> = {
  slow_lead_response: {
    root: "manual_follow_up_process",
    rootLabel: "Manual Follow-Up Process",
    chainLinks: [
      { symptom: "Revenue↓", cause: "Lead Conversion Rate↓" },
      { symptom: "Lead Conversion Rate↓", cause: "Follow-Up Delay↑" },
      { symptom: "Follow-Up Delay↑", cause: "Manual Follow-Up Process (no automation)" },
    ],
    affectedKpiKeys: ["lead_response_time", "lead_conversion_rate", "revenue"],
  },
  manual_follow_up: {
    root: "no_crm_system",
    rootLabel: "No CRM System",
    chainLinks: [
      { symptom: "Lead Conversion Rate↓", cause: "Follow-Up Delay↑" },
      { symptom: "Follow-Up Delay↑", cause: "No CRM system to track and remind" },
    ],
    affectedKpiKeys: ["lead_response_time", "lead_conversion_rate"],
  },
  high_admin_burden: {
    root: "lack_of_automation",
    rootLabel: "Lack of Workflow Automation",
    chainLinks: [
      { symptom: "Owner Productivity↓", cause: "Administrative Hours↑" },
      { symptom: "Administrative Hours↑", cause: "Manual processes consuming staff time" },
      { symptom: "Manual processes", cause: "Lack of workflow automation" },
    ],
    affectedKpiKeys: ["administrative_hours", "business_health_score"],
  },
  cash_flow_pressure: {
    root: "slow_invoice_collection",
    rootLabel: "Slow Invoice Collection",
    chainLinks: [
      { symptom: "Cash Reserve↓", cause: "Outstanding Invoices↑" },
      { symptom: "Outstanding Invoices↑", cause: "Collection Follow-Up Delay↑" },
      { symptom: "Collection Follow-Up Delay↑", cause: "No automated payment reminders" },
    ],
    affectedKpiKeys: ["outstanding_invoices", "profit_margin", "revenue"],
  },
  high_outstanding_invoices: {
    root: "slow_invoice_collection",
    rootLabel: "Slow Invoice Collection",
    chainLinks: [
      { symptom: "Cash Flow↓", cause: "Outstanding Invoices↑" },
      { symptom: "Outstanding Invoices↑", cause: "Manual invoice follow-up process" },
    ],
    affectedKpiKeys: ["outstanding_invoices", "profit_margin"],
  },
  customer_churn_risk: {
    root: "poor_customer_engagement",
    rootLabel: "Poor Customer Engagement",
    chainLinks: [
      { symptom: "Revenue↓", cause: "Customer Retention↓" },
      { symptom: "Customer Retention↓", cause: "Low Review Rating↓" },
      { symptom: "Review Rating↓", cause: "Insufficient proactive customer engagement" },
    ],
    affectedKpiKeys: ["customer_retention", "review_rating", "revenue"],
  },
  low_lead_volume: {
    root: "insufficient_marketing",
    rootLabel: "Insufficient Marketing Activity",
    chainLinks: [
      { symptom: "Revenue Pipeline↓", cause: "Lead Volume↓" },
      { symptom: "Lead Volume↓", cause: "Limited marketing channels active" },
    ],
    affectedKpiKeys: ["lead_conversion_rate", "revenue"],
  },
};

function severityFromConstraints(constraints: BusinessConstraint[]): RootCauseChain["severity"] {
  if (constraints.some((c) => c.severity === "critical")) return "critical";
  if (constraints.some((c) => c.severity === "high")) return "high";
  if (constraints.some((c) => c.severity === "medium")) return "medium";
  return "low";
}

/**
 * Deterministic causal chain analysis.
 * Maps constraint definition keys to known root causes using a static causal map.
 * No LLM inference — every connection is explicit and auditable.
 */
export function analyzeRootCauses(
  constraints: BusinessConstraint[],
  health: BusinessHealth,
  recommendations: BusinessRecommendation[],
  detectedAt: string
): RootCauseAnalysisResult {
  const activeConstraints = constraints.filter(
    (c) => c.status === "active" || c.status === "monitoring"
  );

  const chains: RootCauseChain[] = [];
  const seenRoots = new Set<string>();

  for (const constraint of activeConstraints) {
    const causal = CAUSAL_MAP[constraint.definitionKey];
    if (!causal) continue;
    if (seenRoots.has(causal.root)) continue;
    seenRoots.add(causal.root);

    const relatedRecs = recommendations.filter((r) =>
      r.relatedCapabilities.some((cap) => causal.affectedKpiKeys.includes(cap)) ||
      constraint.id === r.id
    );

    const evidence = [
      `Constraint "${constraint.title}" detected (${constraint.severity} severity)`,
      `Health score: ${health.overallScore.toFixed(1)}/100`,
      ...constraint.evidence.slice(0, 2).map((e) => e.description),
    ];

    const chainLinks: CausalLink[] = causal.chainLinks.map((link) => ({
      symptom: link.symptom,
      cause: link.cause,
      evidence: evidence.slice(0, 2),
      confidence: constraint.confidence,
    }));

    chains.push({
      rootCauseKey: causal.root,
      rootCauseLabel: causal.rootLabel,
      symptomChain: chainLinks,
      recommendedActions: relatedRecs.map((r) => r.title).slice(0, 3),
      severity: severityFromConstraints([constraint]),
      affectedKpiKeys: causal.affectedKpiKeys,
      confidence: constraint.confidence,
    });
  }

  // For unknown constraints not in causal map, produce a generic chain
  for (const constraint of activeConstraints) {
    if (CAUSAL_MAP[constraint.definitionKey]) continue;
    chains.push({
      rootCauseKey: constraint.definitionKey,
      rootCauseLabel: constraint.title,
      symptomChain: [{
        symptom: "Business Health↓",
        cause: constraint.description,
        evidence: [`Constraint detected: ${constraint.title}`],
        confidence: constraint.confidence,
      }],
      recommendedActions: [],
      severity: severityFromConstraints([constraint]),
      affectedKpiKeys: [],
      confidence: constraint.confidence,
    });
  }

  chains.sort((a, b) => {
    const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityRank[b.severity] - severityRank[a.severity]) || (b.confidence - a.confidence);
  });

  const primaryRootCause = chains[0]?.rootCauseKey ?? null;

  const summary = chains.length === 0
    ? `No active constraints detected. Business health score: ${health.overallScore.toFixed(1)}/100.`
    : `${chains.length} root cause(s) identified. Primary: "${chains[0]!.rootCauseLabel}" affecting ${chains[0]!.affectedKpiKeys.join(", ")}. Health score: ${health.overallScore.toFixed(1)}/100.`;

  return { chains, primaryRootCause, summary, detectedAt };
}
