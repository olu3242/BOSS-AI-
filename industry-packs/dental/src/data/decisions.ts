import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "dental_fill_open_schedule_gaps",
    label: "Fill Open Schedule Gaps",
    description: "Identify and fill open chair time by activating the short-notice cancellation list and scheduling incomplete treatment.",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_chair_underutilized", "dental_no_show_rate_high"],
    relatedKpiKeys: ["dental_chair_utilization", "dental_provider_production"],
    playbook: "dental_no_show_reduction_playbook",
    estimatedTimelineDays: 7,
  });

  decisionRegistry.register({
    key: "dental_increase_recall_outreach",
    label: "Increase Recall Outreach",
    description: "Accelerate recall contact cadence for patients overdue for hygiene visits to improve recall completion rate.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_low_recall_rate"],
    relatedKpiKeys: ["dental_recall_completion", "dental_hygiene_reappointment"],
    playbook: "dental_recall_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "dental_improve_case_acceptance",
    label: "Improve Case Acceptance Rate",
    description: "Enhance treatment plan presentation skills, offer financing options, and follow up with undecided patients to raise acceptance rate.",
    category: "customer",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_low_case_acceptance"],
    relatedKpiKeys: ["dental_case_acceptance", "dental_provider_production"],
    playbook: "dental_case_presentation_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "dental_reduce_no_shows",
    label: "Reduce No-Shows",
    description: "Strengthen reminder sequences, implement deposit policy for high-risk appointments, and build a same-day fill list.",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_no_show_rate_high", "dental_high_cancellation_rate"],
    relatedKpiKeys: ["dental_no_show_rate", "dental_cancellation_rate"],
    playbook: "dental_no_show_reduction_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "dental_optimize_provider_schedules",
    label: "Optimize Provider Schedules",
    description: "Balance provider schedules to maximize production per hour and reduce gaps caused by procedure mix imbalance.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_chair_underutilized"],
    relatedKpiKeys: ["dental_provider_production", "dental_chair_utilization"],
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "dental_expand_hygiene_capacity",
    label: "Expand Hygiene Capacity",
    description: "Add hygiene hours or hire an additional hygienist to meet patient demand and improve recall throughput.",
    category: "people",
    defaultSeverity: "medium",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["dental_low_recall_rate"],
    relatedKpiKeys: ["dental_hygiene_reappointment", "dental_recall_completion"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "dental_increase_production",
    label: "Increase Production Per Visit",
    description: "Identify same-day treatment opportunities, promote preventive add-ons, and reduce underutilized appointment types.",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_chair_underutilized"],
    relatedKpiKeys: ["dental_avg_production_per_visit", "dental_provider_production"],
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "dental_improve_collections",
    label: "Improve Collections Ratio",
    description: "Audit claim submission accuracy, reduce writeoffs, and strengthen patient payment collection at checkout.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["dental_low_collections_ratio"],
    relatedKpiKeys: ["dental_collections_ratio", "dental_avg_production_per_visit"],
    playbook: "dental_collections_playbook",
    estimatedTimelineDays: 30,
  });
}
