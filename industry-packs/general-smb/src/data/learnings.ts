import { learningRegistry } from "@boss/registries";

export function seedLearnings(): void {
  learningRegistry.register({
    key: "lead_response_success_pattern",
    label: "Lead Response Success Pattern",
    description: "Tracks when fast lead response times correlate with improved conversion rates.",
    patternType: "success_pattern",
    detectionCondition: "lead_response_time < 1h AND lead_conversion_rate > 0.20",
    minOccurrences: 3,
    memoryKey: "learning:lead_response:success",
    actionableInsight: "Maintain sub-1-hour response SLA as it correlates with 20%+ conversion rates.",
    retentionDays: 90,
  });

  learningRegistry.register({
    key: "no_show_failure_pattern",
    label: "Appointment No-Show Failure Pattern",
    description: "Detects recurring appointment no-show spikes and correlates with reminder timing.",
    patternType: "failure_pattern",
    detectionCondition: "appointment_no_show_rate > 0.20 for 3+ consecutive weeks",
    minOccurrences: 3,
    memoryKey: "learning:no_show:failure",
    actionableInsight: "No-show spikes indicate reminder sequence gap — review timing and channel effectiveness.",
    retentionDays: 60,
  });

  learningRegistry.register({
    key: "peak_revenue_timing_pattern",
    label: "Peak Revenue Timing Pattern",
    description: "Identifies recurring time periods when revenue consistently peaks.",
    patternType: "timing_pattern",
    detectionCondition: "revenue_weekly_variance > 0.15 with consistent peak days",
    minOccurrences: 4,
    memoryKey: "learning:revenue:timing",
    actionableInsight: "Align staff scheduling and marketing spend with identified peak revenue periods.",
    retentionDays: 180,
  });

  learningRegistry.register({
    key: "staff_utilization_resource_pattern",
    label: "Staff Utilization Resource Pattern",
    description: "Tracks patterns of over- or under-utilization to optimize future scheduling.",
    patternType: "resource_pattern",
    detectionCondition: "staff_utilization < 0.60 OR staff_utilization > 0.95",
    minOccurrences: 2,
    memoryKey: "learning:staff:utilization",
    actionableInsight: "Utilization extremes indicate scheduling misalignment — adjust capacity planning.",
    retentionDays: 90,
  });

  learningRegistry.register({
    key: "q4_seasonal_revenue_pattern",
    label: "Q4 Seasonal Revenue Pattern",
    description: "Captures Q4 seasonal revenue uplift for proactive planning in future years.",
    patternType: "seasonal_pattern",
    detectionCondition: "month IN (10, 11, 12) AND revenue > annual_monthly_average * 1.20",
    minOccurrences: 2,
    memoryKey: "learning:seasonal:q4",
    actionableInsight: "Pre-stage inventory, staffing, and marketing in September to capitalize on Q4 uplift.",
    retentionDays: null,
  });

  learningRegistry.register({
    key: "customer_reactivation_success",
    label: "Customer Reactivation Success Pattern",
    description: "Tracks which reactivation campaign types successfully re-engage lapsed customers.",
    patternType: "success_pattern",
    detectionCondition: "reactivation_campaign_sent AND customer_returned_within_30_days",
    minOccurrences: 5,
    memoryKey: "learning:reactivation:success",
    actionableInsight: "Winning reactivation offers — document and reuse for future lapsed customer campaigns.",
    retentionDays: 120,
  });
}
