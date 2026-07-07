/**
 * Wave 1C — Canonical AI Employee registrations.
 *
 * Every AI employee in BOSS is registered here with a full contract:
 * identity, role, capabilities, read/write models, decision authority,
 * memory config, business objectives, lifecycle stages.
 */
import { aiEmployeeRegistry } from "../registries/aiEmployee.js";

export function seedAiEmployees(): void {
  // ALICE — Revenue Intelligence Analyst
  aiEmployeeRegistry.register({
    key: "alice",
    label: "ALICE",
    description: "Revenue Intelligence Analyst — monitors pipeline, forecasts revenue, surfaces conversion opportunities",
    mission: "Maximize revenue by identifying and acting on pipeline and conversion opportunities",
    responsibilities: [
      "Monitor lead-to-close conversion rates",
      "Forecast monthly and quarterly revenue",
      "Surface at-risk opportunities",
      "Generate pipeline health reports",
    ],
    capabilities: ["revenue_forecasting", "pipeline_analysis", "lead_scoring", "conversion_optimization"],
    requiredTools: ["kpi.read", "lead.read", "opportunity.read", "invoice.read"],
    kpis: ["revenue", "pipeline_value", "conversion_rate", "lead_velocity"],
    permissions: ["leads:read", "opportunities:read", "invoices:read", "kpis:read"],
    escalationRules: [
      { condition: "pipeline_gap > 20%", escalateTo: "human:sales-manager", method: "notification" },
      { condition: "revenue_forecast < target * 0.8", escalateTo: "human:ceo", method: "briefing" },
    ],
    lifecycle: "available",
    readModels: ["Lead", "Opportunity", "Invoice", "KpiReadingRecord", "BusinessHealth"],
    writeModels: ["BusinessRecommendation", "ExecutiveBriefingRecord"],
    allowedActions: ["generate_recommendation", "create_briefing", "flag_opportunity"],
    decisionAuthority: "recommend",
    promptTemplateKey: "alice.revenue-analysis",
    memory: { shortTermTtlMinutes: 60, longTermEnabled: true, contextKeys: ["pipeline_state", "forecast_baseline"] },
    businessObjectives: ["revenue_growth", "pipeline_conversion"],
    lifecycleStages: ["lead.converted", "opportunity.won", "invoice.sent", "payment.received"],
  });

  // MAX — Operations Optimizer
  aiEmployeeRegistry.register({
    key: "max",
    label: "MAX",
    description: "Operations Optimizer — tracks job completion, utilization, and workforce efficiency",
    mission: "Maximize operational efficiency and workforce utilization",
    responsibilities: [
      "Monitor job completion rates and cycle times",
      "Identify scheduling inefficiencies",
      "Track technician utilization",
      "Surface operational bottlenecks",
    ],
    capabilities: ["job_scheduling", "utilization_tracking", "bottleneck_analysis", "completion_rate_optimization"],
    requiredTools: ["job.read", "appointment.read", "staff.read", "kpi.read"],
    kpis: ["completion_rate", "utilization_rate", "cycle_time", "on_time_rate"],
    permissions: ["jobs:read", "appointments:read", "staff:read", "kpis:read"],
    escalationRules: [
      { condition: "utilization < 60%", escalateTo: "human:operations-manager", method: "alert" },
      { condition: "completion_rate < 70%", escalateTo: "human:operations-manager", method: "briefing" },
    ],
    lifecycle: "available",
    readModels: ["Job", "Appointment", "StaffMember", "KpiReadingRecord"],
    writeModels: ["BusinessRecommendation", "WorkflowRun"],
    allowedActions: ["generate_recommendation", "trigger_workflow", "flag_job"],
    decisionAuthority: "recommend",
    promptTemplateKey: "max.operations-analysis",
    memory: { shortTermTtlMinutes: 30, longTermEnabled: true, contextKeys: ["utilization_baseline", "schedule_patterns"] },
    businessObjectives: ["operational_efficiency", "workforce_optimization"],
    lifecycleStages: ["job.started", "job.completed", "appointment.confirmed", "appointment.completed"],
  });

  // REX — Customer Retention Specialist
  aiEmployeeRegistry.register({
    key: "rex",
    label: "REX",
    description: "Customer Retention Specialist — prevents churn, drives satisfaction, surfaces re-engagement opportunities",
    mission: "Maximize customer lifetime value and retention rate",
    responsibilities: [
      "Monitor customer engagement and churn risk",
      "Surface at-risk customer accounts",
      "Generate re-engagement campaigns",
      "Track NPS and review scores",
    ],
    capabilities: ["churn_prediction", "sentiment_analysis", "re_engagement", "nps_tracking"],
    requiredTools: ["customer.read", "review.read", "invoice.read", "conversation.read"],
    kpis: ["retention_rate", "nps", "review_score", "customer_lifetime_value"],
    permissions: ["customers:read", "reviews:read", "conversations:read", "kpis:read"],
    escalationRules: [
      { condition: "churn_risk_score > 0.8", escalateTo: "human:account-manager", method: "alert" },
      { condition: "review_score < 3.5", escalateTo: "human:customer-success", method: "notification" },
    ],
    lifecycle: "available",
    readModels: ["Customer", "CustomerInteraction", "CustomerReview", "Conversation", "KpiReadingRecord"],
    writeModels: ["BusinessRecommendation", "CommunicationRequest"],
    allowedActions: ["generate_recommendation", "send_communication", "flag_customer"],
    decisionAuthority: "suggest",
    promptTemplateKey: "rex.retention-analysis",
    memory: { shortTermTtlMinutes: 120, longTermEnabled: true, contextKeys: ["churn_signals", "engagement_history"] },
    businessObjectives: ["customer_retention", "satisfaction_improvement"],
    lifecycleStages: ["review.request", "review.received", "customer.created"],
  });

  // NOVA — Business Intelligence Analyst
  aiEmployeeRegistry.register({
    key: "nova",
    label: "NOVA",
    description: "Business Intelligence Analyst — synthesizes KPIs, generates executive insights, drives strategic decisions",
    mission: "Provide executive-level business intelligence for strategic decision-making",
    responsibilities: [
      "Synthesize KPI data into executive narratives",
      "Generate daily, weekly, monthly briefings",
      "Identify cross-functional trends",
      "Quantify business health trajectory",
    ],
    capabilities: ["kpi_synthesis", "trend_analysis", "executive_reporting", "strategic_forecasting"],
    requiredTools: ["kpi.read", "health.read", "recommendation.read", "decision.read"],
    kpis: ["health_score", "forecast_accuracy", "recommendation_acceptance_rate"],
    permissions: ["kpis:read", "health:read", "recommendations:read", "decisions:read"],
    escalationRules: [
      { condition: "health_score_drop > 15pts", escalateTo: "human:ceo", method: "briefing" },
    ],
    lifecycle: "available",
    readModels: ["KpiReadingRecord", "BusinessHealth", "BusinessRecommendation", "BusinessDecision", "ExecutiveBriefingRecord"],
    writeModels: ["ExecutiveBriefingRecord", "BusinessRecommendation"],
    allowedActions: ["generate_briefing", "generate_recommendation"],
    decisionAuthority: "recommend",
    promptTemplateKey: "nova.executive-analysis",
    memory: { shortTermTtlMinutes: 240, longTermEnabled: true, contextKeys: ["health_trajectory", "strategic_priorities"] },
    businessObjectives: ["strategic_clarity", "decision_quality"],
    lifecycleStages: ["business.kpi.measured", "decision.engine.ran"],
  });

  // FINN — Financial Intelligence Agent
  aiEmployeeRegistry.register({
    key: "finn",
    label: "FINN",
    description: "Financial Intelligence Agent — tracks cash flow, flags payment risks, optimizes pricing and collections",
    mission: "Protect and optimize the financial health of the business",
    responsibilities: [
      "Monitor accounts receivable and overdue invoices",
      "Flag cash flow risks",
      "Analyze pricing against market benchmarks",
      "Track payment velocity and DSO",
    ],
    capabilities: ["cash_flow_analysis", "collections_optimization", "pricing_intelligence", "dso_tracking"],
    requiredTools: ["invoice.read", "payment.read", "estimate.read", "kpi.read"],
    kpis: ["cash_flow", "dso", "collection_rate", "overdue_ratio"],
    permissions: ["invoices:read", "payments:read", "estimates:read", "kpis:read"],
    escalationRules: [
      { condition: "overdue_balance > 30% of receivables", escalateTo: "human:finance-manager", method: "alert" },
      { condition: "cash_flow_negative", escalateTo: "human:ceo", method: "briefing" },
    ],
    lifecycle: "available",
    readModels: ["Invoice", "Payment", "Estimate", "KpiReadingRecord"],
    writeModels: ["BusinessRecommendation", "CommunicationRequest"],
    allowedActions: ["generate_recommendation", "send_communication", "flag_invoice"],
    decisionAuthority: "suggest",
    promptTemplateKey: "finn.financial-analysis",
    memory: { shortTermTtlMinutes: 60, longTermEnabled: true, contextKeys: ["cash_position", "overdue_accounts"] },
    businessObjectives: ["financial_health", "collections_efficiency"],
    lifecycleStages: ["invoice.sent", "invoice.overdue", "payment.received"],
  });

  // LENA — Lead Generation and Nurture Agent
  aiEmployeeRegistry.register({
    key: "lena",
    label: "LENA",
    description: "Lead Generation and Nurture Agent — qualifies leads, accelerates pipeline, personalizes outreach",
    mission: "Maximize qualified lead flow and pipeline conversion velocity",
    responsibilities: [
      "Score and qualify incoming leads",
      "Personalize nurture communications",
      "Identify lead source ROI",
      "Accelerate stalled opportunities",
    ],
    capabilities: ["lead_scoring", "nurture_automation", "source_attribution", "pipeline_acceleration"],
    requiredTools: ["lead.read", "lead.write", "opportunity.read", "communication.send"],
    kpis: ["lead_velocity", "qualification_rate", "nurture_conversion", "source_roi"],
    permissions: ["leads:read", "leads:write", "opportunities:read", "communications:write"],
    escalationRules: [
      { condition: "lead_response_time > 1h", escalateTo: "human:sales-rep", method: "notification" },
    ],
    lifecycle: "available",
    readModels: ["Lead", "Opportunity", "Customer", "KpiReadingRecord"],
    writeModels: ["Lead", "BusinessRecommendation", "CommunicationRequest"],
    allowedActions: ["qualify_lead", "send_communication", "generate_recommendation"],
    decisionAuthority: "execute",
    promptTemplateKey: "lena.lead-nurture",
    memory: { shortTermTtlMinutes: 30, longTermEnabled: false, contextKeys: ["lead_context", "nurture_stage"] },
    businessObjectives: ["pipeline_growth", "lead_conversion"],
    lifecycleStages: ["lead.created", "lead.qualified", "lead.converted"],
  });

  // TESS — Scheduling and Dispatch Coordinator
  aiEmployeeRegistry.register({
    key: "tess",
    label: "TESS",
    description: "Scheduling and Dispatch Coordinator — optimizes appointment scheduling, dispatch, and field routing",
    mission: "Maximize scheduling efficiency, minimize travel time, ensure on-time delivery",
    responsibilities: [
      "Optimize appointment scheduling windows",
      "Coordinate technician dispatch",
      "Minimize route travel time",
      "Handle reschedules and no-shows",
    ],
    capabilities: ["schedule_optimization", "dispatch_routing", "no_show_recovery", "capacity_planning"],
    requiredTools: ["appointment.read", "appointment.write", "job.read", "staff.read"],
    kpis: ["on_time_rate", "no_show_rate", "average_travel_time", "schedule_utilization"],
    permissions: ["appointments:read", "appointments:write", "jobs:read", "staff:read"],
    escalationRules: [
      { condition: "no_show_rate > 20%", escalateTo: "human:operations-manager", method: "alert" },
      { condition: "schedule_conflict detected", escalateTo: "human:dispatcher", method: "notification" },
    ],
    lifecycle: "available",
    readModels: ["Appointment", "Job", "StaffMember", "Customer"],
    writeModels: ["Appointment", "CommunicationRequest"],
    allowedActions: ["reschedule_appointment", "send_reminder", "flag_capacity_issue"],
    decisionAuthority: "approve",
    promptTemplateKey: "tess.scheduling-optimization",
    memory: { shortTermTtlMinutes: 15, longTermEnabled: false, contextKeys: ["daily_schedule", "technician_locations"] },
    businessObjectives: ["scheduling_efficiency", "customer_satisfaction"],
    lifecycleStages: ["appointment.reminder", "appointment.confirmed", "appointment.cancelled"],
  });

  // GABRIEL — Strategic Growth Advisor
  aiEmployeeRegistry.register({
    key: "gabriel",
    label: "GABRIEL",
    description: "Strategic Growth Advisor — identifies growth opportunities, benchmarks against industry, advises on expansion",
    mission: "Identify and quantify growth opportunities that transform business trajectory",
    responsibilities: [
      "Identify upsell and cross-sell opportunities",
      "Benchmark business vs. industry peers",
      "Model expansion scenarios",
      "Advise on strategic pivots",
    ],
    capabilities: ["growth_modeling", "benchmarking", "expansion_planning", "strategic_simulation"],
    requiredTools: ["kpi.read", "health.read", "scenario.read", "decision.read"],
    kpis: ["revenue_growth_rate", "market_share_estimate", "customer_acquisition_cost", "lifetime_value_ratio"],
    permissions: ["kpis:read", "health:read", "scenarios:read", "decisions:read"],
    escalationRules: [
      { condition: "growth_opportunity_value > 100k", escalateTo: "human:ceo", method: "briefing" },
    ],
    lifecycle: "available",
    readModels: ["BusinessHealth", "KpiReadingRecord", "BusinessDecision", "BusinessScenario"],
    writeModels: ["BusinessRecommendation", "BusinessScenario", "ExecutiveBriefingRecord"],
    allowedActions: ["generate_recommendation", "create_scenario", "generate_briefing"],
    decisionAuthority: "recommend",
    promptTemplateKey: "gabriel.strategic-growth",
    memory: { shortTermTtlMinutes: 480, longTermEnabled: true, contextKeys: ["growth_trajectory", "strategic_options"] },
    businessObjectives: ["strategic_growth", "market_expansion"],
    lifecycleStages: ["estimate.accepted", "opportunity.won", "business.kpi.measured"],
  });
}
