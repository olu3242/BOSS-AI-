import { playbookRegistry } from "@boss/registries";

export function seedPlaybooks(): void {
  playbookRegistry.register({
    key: "sales_conversion_playbook",
    label: "Sales Conversion Improvement Playbook",
    description: "Step-by-step actions to improve lead response time and follow-up automation.",
    trigger: "constraint_detected",
    triggerCondition: "constraint.definitionKey IN [slow_lead_response, manual_follow_up]",
    steps: [
      { order: 1, action: "Audit current lead response time", owner: "Owner", expectedOutcome: "Baseline established", timelineHours: 2 },
      { order: 2, action: "Configure CRM lead routing rules", owner: "Sales", expectedOutcome: "Leads auto-assigned within 5 min", timelineHours: 4 },
      { order: 3, action: "Activate automated follow-up sequences", owner: "Sales", expectedOutcome: "3-touch follow-up running", timelineHours: 8 },
      { order: 4, action: "Measure conversion rate improvement at 30 days", owner: "Owner", expectedOutcome: "Conversion delta documented", timelineHours: 1 },
    ],
    relatedDecisionKeys: ["improve_sales_conversion"],
    estimatedTotalHours: 15,
  });
  playbookRegistry.register({
    key: "operations_automation_playbook",
    label: "Operations Automation Playbook",
    description: "Actions to automate scheduling, invoicing, and routine communications.",
    trigger: "constraint_detected",
    triggerCondition: "constraint.definitionKey = high_admin_burden",
    steps: [
      { order: 1, action: "Identify top 3 time-consuming admin tasks", owner: "Owner", expectedOutcome: "Priority list produced", timelineHours: 1 },
      { order: 2, action: "Enable scheduling automation workflow", owner: "Operations", expectedOutcome: "Scheduling automated", timelineHours: 4 },
      { order: 3, action: "Enable invoice auto-send and payment reminders", owner: "Finance", expectedOutcome: "Invoice cycle time reduced", timelineHours: 3 },
      { order: 4, action: "Measure admin hours saved at 2 weeks", owner: "Owner", expectedOutcome: "Time savings quantified", timelineHours: 1 },
    ],
    relatedDecisionKeys: ["reduce_admin_overhead"],
    estimatedTotalHours: 9,
  });
  playbookRegistry.register({
    key: "cash_flow_recovery_playbook",
    label: "Cash Flow Recovery Playbook",
    description: "Rapid actions to reduce outstanding invoices and improve payment velocity.",
    trigger: "kpi_below_target",
    triggerCondition: "kpi.key = outstanding_invoices AND value > threshold",
    steps: [
      { order: 1, action: "Run outstanding invoice report", owner: "Finance", expectedOutcome: "Aged receivables list", timelineHours: 1 },
      { order: 2, action: "Send automated payment reminders for 30+ day invoices", owner: "Finance", expectedOutcome: "Reminders dispatched", timelineHours: 2 },
      { order: 3, action: "Offer payment plan for 60+ day invoices", owner: "Owner", expectedOutcome: "Payment commitments secured", timelineHours: 4 },
      { order: 4, action: "Review credit terms for future customers", owner: "Finance", expectedOutcome: "Updated payment terms", timelineHours: 2 },
    ],
    relatedDecisionKeys: ["improve_cash_flow"],
    estimatedTotalHours: 9,
  });
}
