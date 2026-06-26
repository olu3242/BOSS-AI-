import { constraintCategoryRegistry } from "@boss/registries";

const categories = [
  { key: "sales", categoryKey: "sales" as const, label: "Sales", description: "Lead capture, follow-up, conversion, and quoting." },
  { key: "marketing", categoryKey: "marketing" as const, label: "Marketing", description: "Visibility, demand generation, and reputation." },
  { key: "operations", categoryKey: "operations" as const, label: "Operations", description: "Process consistency, documentation, and delivery." },
  { key: "scheduling", categoryKey: "scheduling" as const, label: "Scheduling", description: "Appointment and resource scheduling discipline." },
  { key: "finance", categoryKey: "finance" as const, label: "Finance", description: "Invoicing, collections, and cash flow visibility." },
  { key: "customer_experience", categoryKey: "customer_experience" as const, label: "Customer Experience", description: "Retention, responsiveness, and satisfaction." },
  { key: "communication", categoryKey: "communication" as const, label: "Communication", description: "Internal and customer-facing communication quality." },
  { key: "reporting", categoryKey: "reporting" as const, label: "Reporting", description: "KPI tracking and business visibility." },
  { key: "staff_productivity", categoryKey: "staff_productivity" as const, label: "Staff Productivity", description: "Team accountability and throughput." },
  { key: "compliance", categoryKey: "compliance" as const, label: "Compliance", description: "Regulatory and policy adherence." },
  { key: "technology", categoryKey: "technology" as const, label: "Technology", description: "Tooling coverage and system integration." },
  { key: "leadership", categoryKey: "leadership" as const, label: "Leadership", description: "Owner dependency and delegation." },
  { key: "growth", categoryKey: "growth" as const, label: "Growth", description: "Constraints limiting scale and expansion." },
];

export function seedConstraintCategories(): void {
  for (const category of categories) {
    constraintCategoryRegistry.register(category);
  }
}
