import { recommendationCategoryRegistry } from "@boss/registries";

const categories = [
  { key: "sales", categoryKey: "sales" as const, label: "Sales", description: "Recommendations that improve lead capture, follow-up, and conversion." },
  { key: "marketing", categoryKey: "marketing" as const, label: "Marketing", description: "Recommendations that improve visibility and reputation." },
  { key: "operations", categoryKey: "operations" as const, label: "Operations", description: "Recommendations that standardize and document process." },
  { key: "customer_experience", categoryKey: "customer_experience" as const, label: "Customer Experience", description: "Recommendations that improve retention and responsiveness." },
  { key: "finance", categoryKey: "finance" as const, label: "Finance", description: "Recommendations that improve collections and cash flow visibility." },
  { key: "scheduling", categoryKey: "scheduling" as const, label: "Scheduling", description: "Recommendations that improve appointment discipline." },
  { key: "communication", categoryKey: "communication" as const, label: "Communication", description: "Recommendations that improve internal and customer communication." },
  { key: "reporting", categoryKey: "reporting" as const, label: "Reporting", description: "Recommendations that improve KPI tracking and visibility." },
  { key: "technology", categoryKey: "technology" as const, label: "Technology", description: "Recommendations that close tooling and integration gaps." },
  { key: "leadership", categoryKey: "leadership" as const, label: "Leadership", description: "Recommendations that reduce owner dependency." },
  { key: "growth", categoryKey: "growth" as const, label: "Growth", description: "Recommendations that remove constraints limiting scale." },
  { key: "compliance", categoryKey: "compliance" as const, label: "Compliance", description: "Recommendations that address regulatory or policy gaps." },
  { key: "productivity", categoryKey: "productivity" as const, label: "Productivity", description: "Recommendations that improve staff throughput and accountability." },
];

export function seedRecommendationCategories(): void {
  for (const category of categories) {
    recommendationCategoryRegistry.register(category);
  }
}
