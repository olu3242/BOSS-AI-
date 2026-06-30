import { businessRuleRegistry } from "@boss/registries";

export function seedBusinessRules(): void {
  businessRuleRegistry.register({
    key: "health_score_minimum",
    label: "Minimum Health Score Gate",
    description: "Block high-cost decisions when health score is below 40.",
    ruleType: "threshold",
    condition: "business.healthScore < 40",
    action: "require_review",
    severity: "high",
    affectedDomains: ["decisions", "investments"],
    overridable: true,
  });
  businessRuleRegistry.register({
    key: "critical_decision_approval",
    label: "Critical Decision Approval Policy",
    description: "Decisions with risk level = critical require executive approval before execution.",
    ruleType: "policy",
    condition: "decision.riskLevel = critical",
    action: "require_review",
    severity: "critical",
    affectedDomains: ["decisions"],
    overridable: false,
  });
  businessRuleRegistry.register({
    key: "cash_reserve_gate",
    label: "Cash Reserve Spending Gate",
    description: "Block decisions with expected cost > 10% of annual revenue when cash constraints are active.",
    ruleType: "financial",
    condition: "decision.expectedCost > annualRevenue * 0.10 AND constraint.cash_flow_pressure = active",
    action: "block",
    severity: "high",
    affectedDomains: ["decisions", "finance"],
    overridable: true,
  });
  businessRuleRegistry.register({
    key: "auto_approve_low_risk",
    label: "Auto-Approve Low-Risk Decisions",
    description: "Decisions with risk = low and confidence ≥ 0.8 are approved automatically.",
    ruleType: "policy",
    condition: "decision.riskLevel = low AND decision.confidenceScore >= 0.8",
    action: "auto_approve",
    severity: "low",
    affectedDomains: ["decisions"],
    overridable: true,
  });
  businessRuleRegistry.register({
    key: "concurrent_decision_limit",
    label: "Concurrent Execution Limit",
    description: "Alert when more than 3 decisions are in executing state simultaneously.",
    ruleType: "operational",
    condition: "count(decisions WHERE status = executing) > 3",
    action: "alert",
    severity: "medium",
    affectedDomains: ["decisions", "operations"],
    overridable: true,
  });
}
