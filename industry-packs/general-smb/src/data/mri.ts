import { mriSectionRegistry, mriQuestionRegistry } from "@boss/registries";

const sections = [
  { key: "identity", sectionKey: "identity" as const, label: "Business Identity", order: 1 },
  { key: "customers", sectionKey: "customers" as const, label: "Customers", order: 2 },
  { key: "sales", sectionKey: "sales" as const, label: "Sales", order: 3 },
  { key: "operations", sectionKey: "operations" as const, label: "Operations", order: 4 },
  { key: "finance", sectionKey: "finance" as const, label: "Finance", order: 5 },
  { key: "marketing", sectionKey: "marketing" as const, label: "Marketing", order: 6 },
  { key: "technology", sectionKey: "technology" as const, label: "Technology", order: 7 },
  { key: "goals", sectionKey: "goals" as const, label: "Goals", order: 8 },
  { key: "pain_points", sectionKey: "pain_points" as const, label: "Pain Points", order: 9 },
];

const questions = [
  // Section 1: Business Identity
  { key: "identity.business_name", sectionKey: "identity" as const, label: "Business Name", type: "text" as const, required: true, order: 1 },
  { key: "identity.business_type", sectionKey: "identity" as const, label: "Business Type", type: "text" as const, required: true, order: 2 },
  { key: "identity.years_operating", sectionKey: "identity" as const, label: "Years Operating", type: "number" as const, required: true, order: 3 },
  { key: "identity.employees", sectionKey: "identity" as const, label: "Employees", type: "number" as const, required: true, order: 4 },
  { key: "identity.locations", sectionKey: "identity" as const, label: "Locations", type: "number" as const, required: true, order: 5 },
  { key: "identity.business_hours", sectionKey: "identity" as const, label: "Business Hours", type: "text" as const, required: false, order: 6 },

  // Section 2: Customers
  { key: "customers.customer_types", sectionKey: "customers" as const, label: "Customer Types", type: "multi_select" as const, options: ["b2c", "b2b", "mixed"], required: true, order: 1 },
  { key: "customers.acquisition_channels", sectionKey: "customers" as const, label: "Acquisition Channels", type: "multi_select" as const, options: ["referral", "search", "social", "ads", "walk_in", "partnerships"], required: true, order: 2 },
  { key: "customers.repeat_business", sectionKey: "customers" as const, label: "Repeat Business", type: "scale" as const, required: true, order: 3 },
  { key: "customers.lifetime_value", sectionKey: "customers" as const, label: "Lifetime Value", type: "number" as const, required: false, order: 4 },
  { key: "customers.communication", sectionKey: "customers" as const, label: "Customer Communication", type: "multi_select" as const, options: ["phone", "email", "sms", "in_person", "chat"], required: true, order: 5 },

  // Section 3: Sales
  { key: "sales.lead_sources", sectionKey: "sales" as const, label: "Lead Sources", type: "multi_select" as const, options: ["referral", "website", "social", "ads", "cold_outreach"], required: true, order: 1 },
  { key: "sales.follow_up_process", sectionKey: "sales" as const, label: "Follow-up Process", type: "single_select" as const, options: ["none", "manual", "semi_automated", "automated"], required: true, order: 2 },
  { key: "sales.sales_cycle", sectionKey: "sales" as const, label: "Sales Cycle", type: "single_select" as const, options: ["same_day", "days", "weeks", "months"], required: true, order: 3 },
  { key: "sales.conversion_rate", sectionKey: "sales" as const, label: "Conversion Rate", type: "number" as const, required: false, order: 4 },
  { key: "sales.quote_process", sectionKey: "sales" as const, label: "Quote Process", type: "single_select" as const, options: ["verbal", "manual_document", "software"], required: true, order: 5 },

  // Section 4: Operations
  { key: "operations.scheduling", sectionKey: "operations" as const, label: "Scheduling", type: "single_select" as const, options: ["paper", "spreadsheet", "software"], required: true, order: 1 },
  { key: "operations.daily_tasks", sectionKey: "operations" as const, label: "Daily Tasks", type: "single_select" as const, options: ["informal", "checklist", "task_software"], required: true, order: 2 },
  { key: "operations.team_responsibilities", sectionKey: "operations" as const, label: "Team Responsibilities", type: "single_select" as const, options: ["undefined", "informal", "documented"], required: true, order: 3 },
  { key: "operations.process_documentation", sectionKey: "operations" as const, label: "Process Documentation", type: "boolean" as const, required: true, order: 4 },
  { key: "operations.bottlenecks", sectionKey: "operations" as const, label: "Bottlenecks", type: "multi_select" as const, options: ["scheduling", "communication", "staffing", "supply", "approvals"], required: false, order: 5 },

  // Section 5: Finance
  { key: "finance.revenue_sources", sectionKey: "finance" as const, label: "Revenue Sources", type: "multi_select" as const, options: ["products", "services", "subscriptions", "mixed"], required: true, order: 1 },
  { key: "finance.invoicing", sectionKey: "finance" as const, label: "Invoicing", type: "single_select" as const, options: ["manual", "spreadsheet", "software"], required: true, order: 2 },
  { key: "finance.collections", sectionKey: "finance" as const, label: "Collections", type: "single_select" as const, options: ["informal", "manual_reminders", "automated"], required: true, order: 3 },
  { key: "finance.expenses", sectionKey: "finance" as const, label: "Expenses", type: "single_select" as const, options: ["unmanaged", "manual_tracking", "software"], required: true, order: 4 },
  { key: "finance.cash_flow_visibility", sectionKey: "finance" as const, label: "Cash Flow Visibility", type: "scale" as const, required: true, order: 5 },

  // Section 6: Marketing
  { key: "marketing.website", sectionKey: "marketing" as const, label: "Website", type: "boolean" as const, required: true, order: 1 },
  { key: "marketing.social_media", sectionKey: "marketing" as const, label: "Social Media", type: "multi_select" as const, options: ["facebook", "instagram", "linkedin", "tiktok", "none"], required: false, order: 2 },
  { key: "marketing.email_marketing", sectionKey: "marketing" as const, label: "Email Marketing", type: "boolean" as const, required: true, order: 3 },
  { key: "marketing.reviews", sectionKey: "marketing" as const, label: "Reviews", type: "scale" as const, required: true, order: 4 },
  { key: "marketing.referral_programs", sectionKey: "marketing" as const, label: "Referral Programs", type: "boolean" as const, required: true, order: 5 },

  // Section 7: Technology
  { key: "technology.crm", sectionKey: "technology" as const, label: "CRM", type: "boolean" as const, required: true, order: 1 },
  { key: "technology.accounting_software", sectionKey: "technology" as const, label: "Accounting Software", type: "boolean" as const, required: true, order: 2 },
  { key: "technology.calendar", sectionKey: "technology" as const, label: "Calendar", type: "boolean" as const, required: true, order: 3 },
  { key: "technology.phone", sectionKey: "technology" as const, label: "Phone", type: "single_select" as const, options: ["personal_cell", "business_line", "voip_system"], required: true, order: 4 },
  { key: "technology.email", sectionKey: "technology" as const, label: "Email", type: "single_select" as const, options: ["personal", "business_domain"], required: true, order: 5 },
  { key: "technology.existing_ai_usage", sectionKey: "technology" as const, label: "Existing AI Usage", type: "boolean" as const, required: true, order: 6 },

  // Section 8: Goals
  { key: "goals.priorities", sectionKey: "goals" as const, label: "Top Goals", type: "multi_select" as const, options: ["growth", "profitability", "customer_experience", "operations", "automation", "staff_productivity"], required: true, order: 1 },

  // Section 9: Pain Points
  { key: "pain_points.challenges", sectionKey: "pain_points" as const, label: "Challenges", type: "multi_select" as const, options: ["missed_leads", "slow_follow_up", "administrative_overload", "low_reviews", "poor_visibility", "scheduling_issues", "outstanding_invoices", "customer_retention"], required: true, order: 1 },
];

export function seedMri(): void {
  for (const section of sections) {
    mriSectionRegistry.register(section);
  }
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
