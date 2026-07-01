import { constraintRegistry } from "@boss/registries";
import type { ConstraintEntry } from "@boss/registries";

const constraints: ConstraintEntry[] = [
  {
    key: "hs_callback_rate_high",
    label: "High Callback Rate",
    description: "Callback rate exceeds 8% — technicians are not completing jobs correctly first time.",
    relatedCapabilities: ["operations"],
  },
  {
    key: "hs_low_technician_utilization",
    label: "Low Technician Utilization",
    description: "Technician billable hours are below 70% — capacity is being wasted.",
    relatedCapabilities: ["scheduling"],
  },
  {
    key: "hs_missed_dispatch",
    label: "Missed Dispatch SLA",
    description: "Jobs are not being dispatched within the promised response window.",
    relatedCapabilities: ["scheduling"],
  },
  {
    key: "hs_low_estimate_acceptance",
    label: "Low Estimate Acceptance Rate",
    description: "Fewer than 55% of estimates are being approved — pricing or presentation needs review.",
    relatedCapabilities: ["sales"],
  },
  {
    key: "hs_low_maintenance_renewal",
    label: "Low Maintenance Plan Renewal Rate",
    description: "Maintenance agreement renewals are below 60% — recurring revenue at risk.",
    relatedCapabilities: ["customer_success"],
  },
  {
    key: "hs_emergency_backlog",
    label: "Emergency Call Backlog",
    description: "Emergency service requests are not being addressed within 4 hours.",
    relatedCapabilities: ["scheduling"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
