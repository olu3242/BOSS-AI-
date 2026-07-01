import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "hcare_hire_caregivers",
    label: "Hire Additional Caregivers",
    description: "Recruit and onboard additional caregivers to meet growing client demand and reduce caregiver shortage risk.",
    category: "people",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["hcare_caregiver_shortage", "hcare_caregiver_utilization_low"],
    relatedKpiKeys: ["hcare_caregiver_utilization", "hcare_caregiver_turnover_rate"],
    playbook: "hcare_caregiver_retention_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "hcare_expand_service_area",
    label: "Expand Service Area",
    description: "Enter new geographic markets or zip codes to grow the client base and increase caregiver utilization.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["hcare_caregiver_utilization_low"],
    relatedKpiKeys: ["hcare_caregiver_utilization", "hcare_referral_conversion_rate"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "hcare_add_specialized_care",
    label: "Add Specialized Care Services",
    description: "Introduce specialized care offerings such as dementia care, post-surgery recovery support, or Parkinson's care to differentiate and capture higher-value clients.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["hcare_client_churn_high"],
    relatedKpiKeys: ["hcare_client_retention_rate", "hcare_revenue_per_caregiver_hour"],
    estimatedTimelineDays: 45,
  });

  decisionRegistry.register({
    key: "hcare_raise_billing_rates",
    label: "Raise Billing Rates",
    description: "Increase client billing rates to improve revenue per caregiver hour and maintain profitability as labor costs rise.",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [] as string[],
    relatedKpiKeys: ["hcare_revenue_per_caregiver_hour", "hcare_client_retention_rate"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "hcare_partner_with_referral_sources",
    label: "Partner with Referral Sources",
    description: "Establish formal referral partnerships with hospitals, skilled nursing facilities, physicians, and elder law attorneys to grow the client pipeline.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [] as string[],
    relatedKpiKeys: ["hcare_referral_conversion_rate", "hcare_client_retention_rate"],
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "hcare_implement_caregiver_training",
    label: "Implement Caregiver Training Program",
    description: "Launch a structured training program covering specialized skills, safety protocols, and client communication to reduce turnover and improve quality.",
    category: "people",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["hcare_caregiver_turnover_high", "hcare_compliance_gap"],
    relatedKpiKeys: ["hcare_caregiver_turnover_rate", "hcare_client_satisfaction_score"],
    playbook: "hcare_caregiver_retention_playbook",
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "hcare_adopt_care_management_software",
    label: "Adopt Care Management Software",
    description: "Implement dedicated home care management software to streamline scheduling, documentation, billing, and compliance reporting.",
    category: "technology",
    defaultSeverity: "medium",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["hcare_billing_errors_high", "hcare_missed_visits_high"],
    relatedKpiKeys: ["hcare_missed_visit_rate", "hcare_billable_hours_pct"],
    playbook: "hcare_missed_visit_playbook",
    estimatedTimelineDays: 45,
  });

  decisionRegistry.register({
    key: "hcare_launch_family_portal",
    label: "Launch Family Communication Portal",
    description: "Deploy a family-facing portal that provides real-time visibility into care schedules, visit notes, and caregiver check-ins to improve transparency and retention.",
    category: "customer",
    defaultSeverity: "low",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["hcare_client_churn_high"],
    relatedKpiKeys: ["hcare_client_satisfaction_score", "hcare_client_retention_rate"],
    playbook: "hcare_client_retention_playbook",
    estimatedTimelineDays: 30,
  });
}
