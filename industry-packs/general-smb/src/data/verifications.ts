import { verificationRegistry } from "@boss/registries";

export function seedVerifications(): void {
  verificationRegistry.register({
    key: "revenue_kpi_verification",
    label: "Revenue KPI Delta Verification",
    description: "Verifies revenue improvement by measuring KPI delta before and after plan execution.",
    method: "kpi_delta",
    primaryKpiKey: "revenue",
    successThresholdPct: 5,
    measurementWindowDays: 30,
    minConfidence: 0.75,
  });

  verificationRegistry.register({
    key: "retention_rate_verification",
    label: "Customer Retention Rate Verification",
    description: "Verifies customer retention improvement using KPI delta over a 60-day measurement window.",
    method: "kpi_delta",
    primaryKpiKey: "customer_retention_rate",
    successThresholdPct: 3,
    measurementWindowDays: 60,
    minConfidence: 0.80,
  });

  verificationRegistry.register({
    key: "workflow_completion_verification",
    label: "Workflow Completion Rate Verification",
    description: "Verifies that assigned workflows completed successfully within the plan window.",
    method: "workflow_completion",
    primaryKpiKey: "workflow_completion_rate",
    successThresholdPct: 90,
    measurementWindowDays: 7,
    minConfidence: 0.90,
  });

  verificationRegistry.register({
    key: "roi_comparison_verification",
    label: "ROI Comparison Verification",
    description: "Verifies positive ROI by comparing revenue gain against cost of execution activities.",
    method: "roi_comparison",
    primaryKpiKey: "revenue",
    successThresholdPct: 10,
    measurementWindowDays: 45,
    minConfidence: 0.70,
  });

  verificationRegistry.register({
    key: "composite_health_verification",
    label: "Composite Business Health Verification",
    description: "Verifies overall business health score improvement using composite method across all KPI dimensions.",
    method: "composite",
    primaryKpiKey: "overall_health_score",
    successThresholdPct: 5,
    measurementWindowDays: 30,
    minConfidence: 0.75,
  });
}
