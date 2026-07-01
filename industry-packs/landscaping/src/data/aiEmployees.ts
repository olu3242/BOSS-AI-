import { aiEmployeeRegistry } from "@boss/registries";

const aiEmployees = [
  {
    key: "lscape_operations_manager",
    label: "Operations Manager",
    mission: "Oversee daily field operations, monitor crew performance, and ensure all jobs are completed on time and to standard.",
    responsibilities: [
      "Monitor daily job completion status across all crews",
      "Identify scheduling conflicts and resolve crew assignments",
      "Track KPIs: revenue per crew hour, job completion rate",
      "Escalate recurring operational issues to the owner",
    ],
    capabilities: [
      "Job status monitoring",
      "Crew performance analysis",
      "KPI dashboard oversight",
      "Daily operations reporting",
    ],
    requiredTools: ["job_tracker", "crew_dashboard", "kpi_dashboard"],
    kpis: ["lscape_revenue_per_crew_hour", "lscape_job_completion_rate", "lscape_labor_cost_pct"],
    permissions: ["read:jobs", "read:crews", "write:alerts"],
    escalationRules: ["Escalate if job completion rate drops below 90% in a single week"],
    lifecycle: "available" as const,
  },
  {
    key: "lscape_estimator",
    label: "Estimator",
    mission: "Convert inbound leads into booked jobs by delivering fast, accurate, and competitively priced estimates.",
    responsibilities: [
      "Review inbound estimate requests within 24 hours",
      "Conduct virtual or on-site property assessments",
      "Prepare detailed estimates with line-item scope and pricing",
      "Follow up with prospects who have not responded within 3 days",
    ],
    capabilities: [
      "Property measurement and scoping",
      "Estimate generation and pricing",
      "Prospect follow-up sequencing",
      "Conversion rate tracking",
    ],
    requiredTools: ["estimate_builder", "property_map_viewer", "customer_outreach"],
    kpis: ["lscape_estimate_conversion_rate", "lscape_avg_job_value"],
    permissions: ["read:leads", "write:estimates", "write:follow_ups"],
    escalationRules: ["Escalate large commercial estimates over $5,000 to owner for review"],
    lifecycle: "available" as const,
  },
  {
    key: "lscape_crew_dispatcher",
    label: "Crew Dispatcher",
    mission: "Optimize daily crew routes and job assignments to maximize revenue per crew hour and minimize drive time.",
    responsibilities: [
      "Build daily job schedules and assign crews before 6am",
      "Optimize routes to reduce travel time between jobs",
      "Notify crew leaders of their assignments via SMS",
      "Adjust schedules in real time when jobs are added, changed, or cancelled",
    ],
    capabilities: [
      "Route optimization",
      "Crew assignment scheduling",
      "Real-time schedule adjustment",
      "SMS dispatch notifications",
    ],
    requiredTools: ["route_optimizer", "scheduling_system", "sms_sender"],
    kpis: ["lscape_revenue_per_crew_hour", "lscape_equipment_utilization", "lscape_job_completion_rate"],
    permissions: ["write:schedule", "read:crews", "write:notifications"],
    escalationRules: ["Escalate crew no-shows to Operations Manager immediately"],
    lifecycle: "available" as const,
  },
  {
    key: "lscape_customer_relations_manager",
    label: "Customer Relations Manager",
    mission: "Build long-term customer loyalty by delivering proactive communication, gathering feedback, and resolving issues before they cause churn.",
    responsibilities: [
      "Send job confirmation messages to customers before scheduled service",
      "Follow up after job completion to capture satisfaction feedback",
      "Request online reviews from satisfied customers",
      "Identify at-risk customers and trigger retention outreach",
    ],
    capabilities: [
      "Customer communication automation",
      "Satisfaction survey management",
      "Review request campaigns",
      "Churn risk identification",
    ],
    requiredTools: ["sms_email_sender", "review_platform", "customer_analytics"],
    kpis: ["lscape_customer_retention_rate", "lscape_online_review_rating"],
    permissions: ["read:customers", "write:outreach", "read:reviews"],
    escalationRules: ["Escalate complaints and negative reviews to owner within 2 hours"],
    lifecycle: "available" as const,
  },
  {
    key: "lscape_equipment_coordinator",
    label: "Equipment Coordinator",
    mission: "Ensure all equipment is maintained, tracked, and available for deployment so crews never lose a job day to a breakdown.",
    responsibilities: [
      "Track maintenance schedules for all equipment",
      "Log breakdown incidents and coordinate repairs",
      "Monitor equipment utilization rates",
      "Flag equipment that is consistently underperforming",
    ],
    capabilities: [
      "Preventive maintenance scheduling",
      "Breakdown incident logging",
      "Equipment utilization reporting",
      "Repair coordination",
    ],
    requiredTools: ["equipment_tracker", "maintenance_scheduler", "vendor_directory"],
    kpis: ["lscape_equipment_utilization"],
    permissions: ["read:equipment", "write:maintenance_logs", "write:alerts"],
    escalationRules: ["Escalate any equipment breakdown that grounds a crew to Operations Manager immediately"],
    lifecycle: "available" as const,
  },
  {
    key: "lscape_seasonal_planner",
    label: "Seasonal Planner",
    mission: "Prepare the business for each season by forecasting demand, optimizing staffing levels, and identifying off-season revenue opportunities.",
    responsibilities: [
      "Generate seasonal revenue forecasts based on prior-year data",
      "Recommend staffing ramp-up and ramp-down schedules",
      "Identify off-season service opportunities (snow removal, holiday lighting)",
      "Monitor the seasonal revenue index and flag gaps",
    ],
    capabilities: [
      "Seasonal revenue forecasting",
      "Staffing demand planning",
      "Off-season service identification",
      "KPI trend analysis",
    ],
    requiredTools: ["revenue_forecaster", "kpi_dashboard", "report_generator"],
    kpis: ["lscape_seasonal_revenue_index", "lscape_labor_cost_pct", "lscape_revenue_per_crew_hour"],
    permissions: ["read:revenue", "read:kpis", "write:forecasts"],
    escalationRules: ["Escalate to owner if seasonal revenue index falls below 0.7 for two consecutive months"],
    lifecycle: "available" as const,
  },
];

export function seedAiEmployees(): void {
  for (const employee of aiEmployees) {
    aiEmployeeRegistry.register(employee);
  }
}
