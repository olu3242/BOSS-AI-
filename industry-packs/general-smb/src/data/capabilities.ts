import { capabilityRegistry } from "@boss/registries";

const capabilities = [
  { key: "sales", label: "Sales", description: "Pipeline, quoting, and closing new business." },
  { key: "marketing", label: "Marketing", description: "Campaigns, content, and brand visibility." },
  { key: "lead_management", label: "Lead Management", description: "Capturing and qualifying inbound interest." },
  { key: "customer_management", label: "Customer Management", description: "Tracking customer relationships and history." },
  { key: "scheduling", label: "Scheduling", description: "Appointment and resource booking." },
  { key: "operations", label: "Operations", description: "Day-to-day service or production delivery." },
  { key: "communication", label: "Communication", description: "Inbound/outbound customer messaging." },
  { key: "reviews", label: "Reviews", description: "Reputation and review management." },
  { key: "finance", label: "Finance", description: "Revenue, expenses, and profitability tracking." },
  { key: "billing", label: "Billing", description: "Invoicing and payment collection." },
  { key: "reporting", label: "Reporting", description: "Business performance visibility." },
  { key: "task_management", label: "Task Management", description: "Internal work tracking." },
  { key: "documents", label: "Documents", description: "Contracts, proposals, and file management." },
  { key: "notifications", label: "Notifications", description: "Alerts to staff and customers." },
  { key: "team_collaboration", label: "Team Collaboration", description: "Coordination across employees." },
] as const;

export function seedCapabilities(): void {
  for (const capability of capabilities) {
    capabilityRegistry.register(capability);
  }
}
