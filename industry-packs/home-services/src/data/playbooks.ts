import { playbookRegistry } from "@boss/registries";
import type { PlaybookEntry } from "@boss/registries";

const playbooks: PlaybookEntry[] = [
  {
    key: "hs_dispatch_playbook",
    label: "Dispatch Playbook",
    description: "Assign and route technicians to jobs efficiently with SMS customer notification.",
    trigger: "manual",
    triggerCondition: "New job scheduled or emergency call received",
    steps: [
      { order: 1, action: "Confirm service type and customer address", owner: "AI Dispatcher", expectedOutcome: "Job record validated", timelineHours: 0.1 },
      { order: 2, action: "Check technician availability and skills matrix", owner: "AI Dispatcher", expectedOutcome: "Eligible technicians identified", timelineHours: 0.1 },
      { order: 3, action: "Assign technician and optimize route", owner: "AI Dispatcher", expectedOutcome: "Technician assigned with GPS route", timelineHours: 0.1 },
      { order: 4, action: "Send customer SMS with technician name and ETA", owner: "AI Dispatcher", expectedOutcome: "Customer notified", timelineHours: 0.1 },
    ],
    relatedDecisionKeys: ["hs_rebalance_schedules", "hs_prioritize_emergency"],
    estimatedTotalHours: 0.5,
  },
  {
    key: "hs_job_execution_playbook",
    label: "Job Execution Playbook",
    description: "Field process for completing a service call to first-time fix standard.",
    trigger: "decision_approved",
    triggerCondition: "Job dispatched and technician en route",
    steps: [
      { order: 1, action: "Arrive on time, introduce to customer", owner: "Technician", expectedOutcome: "Customer greeted", timelineHours: 0.1 },
      { order: 2, action: "Diagnose issue and confirm scope", owner: "Technician", expectedOutcome: "Root cause identified", timelineHours: 0.5 },
      { order: 3, action: "Complete repair using truck stock parts", owner: "Technician", expectedOutcome: "Repair completed", timelineHours: 2.0 },
      { order: 4, action: "Test work and collect digital sign-off", owner: "Technician", expectedOutcome: "Customer confirms completion", timelineHours: 0.2 },
      { order: 5, action: "Collect payment on-site", owner: "Technician", expectedOutcome: "Invoice paid", timelineHours: 0.1 },
    ],
    relatedDecisionKeys: ["hs_hire_technician", "hs_reorder_inventory"],
    estimatedTotalHours: 3,
  },
  {
    key: "hs_maintenance_playbook",
    label: "Maintenance Plan Playbook",
    description: "Convert one-time customers to annual maintenance plan subscribers.",
    trigger: "recommendation_approved",
    triggerCondition: "Job completed, customer has no active maintenance plan",
    steps: [
      { order: 1, action: "Review equipment age and service history", owner: "AI Customer Success Manager", expectedOutcome: "Maintenance need confirmed", timelineHours: 0.2 },
      { order: 2, action: "Present maintenance plan options", owner: "AI Customer Success Manager", expectedOutcome: "Customer informed of options", timelineHours: 0.3 },
      { order: 3, action: "Collect agreement and set up renewal reminder", owner: "AI Customer Success Manager", expectedOutcome: "Agreement signed", timelineHours: 0.2 },
      { order: 4, action: "Schedule first annual visit within 60 days", owner: "AI Dispatcher", expectedOutcome: "Visit on calendar", timelineHours: 0.1 },
    ],
    relatedDecisionKeys: ["hs_promote_maintenance_plans"],
    estimatedTotalHours: 1,
  },
  {
    key: "hs_estimate_follow_up_playbook",
    label: "Estimate Follow-Up Playbook",
    description: "Re-engage customers who have not responded to an estimate within 5 days.",
    trigger: "kpi_below_target",
    triggerCondition: "hs_estimate_acceptance_rate below 60%",
    steps: [
      { order: 1, action: "Identify all open estimates older than 5 days", owner: "AI Revenue Manager", expectedOutcome: "Stale estimate list ready", timelineHours: 0.1 },
      { order: 2, action: "Send personalized follow-up email with financing options", owner: "AI Revenue Manager", expectedOutcome: "Follow-up sent", timelineHours: 0.2 },
      { order: 3, action: "Call customer if no response after 48 hours", owner: "Owner", expectedOutcome: "Outcome captured (approved/declined)", timelineHours: 0.3 },
      { order: 4, action: "Close estimate if no response after 14 days", owner: "AI Revenue Manager", expectedOutcome: "Pipeline kept clean", timelineHours: 0.1 },
    ],
    relatedDecisionKeys: ["hs_follow_up_stale_estimates"],
    estimatedTotalHours: 1,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
