import { playbookRegistry } from "@boss/registries";

export function seedPlaybooks(): void {
  playbookRegistry.register({
    key: "acct_ar_collection_playbook",
    label: "AR Collection Playbook",
    description: "Systematic AR follow-up to reduce outstanding receivables and improve cash flow",
    trigger: "kpi_below_target" as const,
    triggerCondition: "acct_realization_rate < 88%",
    steps: [
      { order: 1, action: "Run AR aging report by client and segment into 30/60/90+ buckets", owner: "acct_billing_manager", expectedOutcome: "Clear picture of overdue accounts by severity", timelineHours: 1 },
      { order: 2, action: "Send courtesy reminder email to all 30-day outstanding clients", owner: "acct_billing_manager", expectedOutcome: "15% of 30-day accounts pay within 5 business days", timelineHours: 2 },
      { order: 3, action: "Partner phone call to 60-day outstanding clients", owner: "acct_managing_partner", expectedOutcome: "Payment commitment or payment plan established", timelineHours: 4 },
      { order: 4, action: "Formal demand letter to 90+ day accounts", owner: "acct_billing_manager", expectedOutcome: "Clients respond with payment or dispute", timelineHours: 2 },
    ],
    relatedDecisionKeys: ["acct_improve_ar_collection"],
    estimatedTotalHours: 9,
  });

  playbookRegistry.register({
    key: "acct_referral_playbook",
    label: "Referral Network Playbook",
    description: "Build systematic referral relationships to grow new client pipeline",
    trigger: "kpi_below_target" as const,
    triggerCondition: "acct_new_clients_per_quarter < quarterly_target * 0.75",
    steps: [
      { order: 1, action: "Audit current referral sources and conversion rates over past 12 months", owner: "acct_business_developer", expectedOutcome: "Ranked list of referral sources by volume and quality", timelineHours: 2 },
      { order: 2, action: "Identify 10 target referral partners (attorneys, bankers, financial advisors)", owner: "acct_managing_partner", expectedOutcome: "Prioritized prospect list with warm introduction paths", timelineHours: 2 },
      { order: 3, action: "Schedule coffee meetings or calls with top 5 referral prospects", owner: "acct_managing_partner", expectedOutcome: "5 referral conversations initiated", timelineHours: 5 },
      { order: 4, action: "Implement referral thank-you system and reciprocal referral tracking", owner: "acct_client_manager", expectedOutcome: "Systematic referral appreciation and reciprocity in place", timelineHours: 3 },
    ],
    relatedDecisionKeys: ["acct_build_referral_network"],
    estimatedTotalHours: 12,
  });

  playbookRegistry.register({
    key: "acct_rate_increase_playbook",
    label: "Rate Increase Playbook",
    description: "Implement billing rate increases with minimal client attrition",
    trigger: "recommendation_approved" as const,
    triggerCondition: "acct_increase_billing_rates approved",
    steps: [
      { order: 1, action: "Benchmark current rates against local CPA market data", owner: "acct_managing_partner", expectedOutcome: "Clear evidence of rate positioning vs market", timelineHours: 3 },
      { order: 2, action: "Segment clients by tenure, profitability, and price sensitivity", owner: "acct_billing_manager", expectedOutcome: "Phased rollout plan by client segment", timelineHours: 2 },
      { order: 3, action: "Send 60-day advance notice to all affected clients", owner: "acct_client_manager", expectedOutcome: "All clients notified before effective date", timelineHours: 3 },
    ],
    relatedDecisionKeys: ["acct_increase_billing_rates"],
    estimatedTotalHours: 8,
  });

  playbookRegistry.register({
    key: "acct_client_retention_playbook",
    label: "Client Retention Playbook",
    description: "Proactive outreach and value demonstration to retain at-risk clients",
    trigger: "constraint_detected" as const,
    triggerCondition: "acct_low_client_retention",
    steps: [
      { order: 1, action: "Identify clients with no contact in 90+ days or declining engagement", owner: "acct_client_manager", expectedOutcome: "At-risk client list prioritized for outreach", timelineHours: 2 },
      { order: 2, action: "Schedule quarterly business review meetings with top 10 clients", owner: "acct_managing_partner", expectedOutcome: "QBRs scheduled and conducted", timelineHours: 8 },
      { order: 3, action: "Deliver personalized value summary report to each at-risk client", owner: "acct_client_manager", expectedOutcome: "Clients see measurable value delivered by the firm", timelineHours: 6 },
      { order: 4, action: "Proactively introduce advisory services to compliance-only clients", owner: "acct_business_developer", expectedOutcome: "2-3 advisory engagements opened from existing clients", timelineHours: 4 },
    ],
    relatedDecisionKeys: ["acct_client_retention_program"],
    estimatedTotalHours: 20,
  });
}
