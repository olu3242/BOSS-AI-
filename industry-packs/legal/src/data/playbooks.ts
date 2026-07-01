import { playbookRegistry } from "@boss/registries";

export function seedPlaybooks(): void {
  playbookRegistry.register({
    key: "legal_ar_collection_playbook",
    label: "AR Collection Playbook",
    description: "Systematic process to reduce outstanding receivables and improve cash flow",
    trigger: "kpi_below_target" as const,
    triggerCondition: "legal_realization_rate < 85%",
    steps: [
      { order: 1, action: "Run AR aging report and segment by 30/60/90+ days", owner: "legal_billing_manager", expectedOutcome: "Clear view of overdue accounts by aging bucket", timelineHours: 1 },
      { order: 2, action: "Send courtesy reminder to 30-day outstanding accounts", owner: "legal_billing_manager", expectedOutcome: "15% of 30-day accounts pay within 5 days", timelineHours: 2 },
      { order: 3, action: "Partner phone call to 60-day outstanding clients", owner: "legal_managing_partner", expectedOutcome: "Payment plan established for 60-day accounts", timelineHours: 4 },
      { order: 4, action: "Formal demand letter to 90+ day accounts", owner: "legal_billing_manager", expectedOutcome: "Clients either pay or respond with dispute", timelineHours: 2 },
      { order: 5, action: "Evaluate write-off vs collections referral for uncollectable accounts", owner: "legal_managing_partner", expectedOutcome: "Resolution decision made on all 90+ day accounts", timelineHours: 2 },
    ],
    relatedDecisionKeys: ["legal_improve_ar_collection"],
    estimatedTotalHours: 11,
  });

  playbookRegistry.register({
    key: "legal_referral_network_playbook",
    label: "Referral Network Playbook",
    description: "Build systematic referral relationships to grow new matter volume",
    trigger: "kpi_below_target" as const,
    triggerCondition: "legal_new_matters_per_month < monthly_target * 0.8",
    steps: [
      { order: 1, action: "Audit current referral sources and conversion rates", owner: "legal_business_developer", expectedOutcome: "Ranked list of referral sources by volume and quality", timelineHours: 2 },
      { order: 2, action: "Identify top 10 potential new referral partners", owner: "legal_managing_partner", expectedOutcome: "Target list of complementary attorneys and professionals", timelineHours: 2 },
      { order: 3, action: "Schedule coffee meetings with top 5 prospects", owner: "legal_managing_partner", expectedOutcome: "5 referral relationship conversations initiated", timelineHours: 5 },
      { order: 4, action: "Implement referral thank-you and reciprocity system", owner: "legal_client_relations_manager", expectedOutcome: "Systematic referral appreciation process in place", timelineHours: 3 },
    ],
    relatedDecisionKeys: ["legal_build_referral_network"],
    estimatedTotalHours: 12,
  });

  playbookRegistry.register({
    key: "legal_write_off_reduction_playbook",
    label: "Write-Off Reduction Playbook",
    description: "Address root causes of write-offs through better intake screening and billing discipline",
    trigger: "constraint_detected" as const,
    triggerCondition: "legal_high_write_offs",
    steps: [
      { order: 1, action: "Analyze write-offs by matter type and client to find patterns", owner: "legal_managing_partner", expectedOutcome: "Root causes of write-offs identified", timelineHours: 3 },
      { order: 2, action: "Strengthen intake process for problematic matter types", owner: "legal_intake_coordinator", expectedOutcome: "Better-scoped engagement letters with clearer estimates", timelineHours: 4 },
      { order: 3, action: "Implement mid-matter budget check-ins with clients", owner: "legal_operations_manager", expectedOutcome: "Clients aware of fees before bill shock occurs", timelineHours: 2 },
    ],
    relatedDecisionKeys: ["legal_reduce_write_offs"],
    estimatedTotalHours: 9,
  });

  playbookRegistry.register({
    key: "legal_rate_increase_playbook",
    label: "Rate Increase Playbook",
    description: "Implement billing rate increases with minimal client attrition",
    trigger: "recommendation_approved" as const,
    triggerCondition: "legal_increase_billing_rates approved",
    steps: [
      { order: 1, action: "Benchmark current rates against local market data", owner: "legal_managing_partner", expectedOutcome: "Clear data on firm position vs market rates", timelineHours: 3 },
      { order: 2, action: "Segment clients by sensitivity and matter type", owner: "legal_business_developer", expectedOutcome: "Phased rollout plan by client segment", timelineHours: 2 },
      { order: 3, action: "Notify clients 60 days in advance with rate increase letter", owner: "legal_client_relations_manager", expectedOutcome: "All clients notified before effective date", timelineHours: 3 },
      { order: 4, action: "Monitor client response and retention after increase", owner: "legal_managing_partner", expectedOutcome: "Attrition rate measured and documented", timelineHours: 2 },
    ],
    relatedDecisionKeys: ["legal_increase_billing_rates"],
    estimatedTotalHours: 10,
  });
}
