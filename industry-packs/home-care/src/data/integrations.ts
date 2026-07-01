import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "hcare_calendar_provider",
    providerKey: "hcare_calendar",
    label: "Care Scheduling Calendar",
    category: "calendar" as const,
    supportedCapabilities: [
      "visit_scheduling",
      "caregiver_availability",
      "shift_management",
      "recurring_visits",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "hcare_accounting_provider",
    providerKey: "hcare_accounting",
    label: "Home Care Accounting",
    category: "accounting" as const,
    supportedCapabilities: [
      "invoice_generation",
      "payment_tracking",
      "revenue_reporting",
      "accounts_receivable",
    ],
    authType: "api_key" as const,
  },
  {
    key: "hcare_sms_provider",
    providerKey: "hcare_sms",
    label: "SMS & Family Notifications",
    category: "sms" as const,
    supportedCapabilities: [
      "caregiver_check_in_alerts",
      "family_notifications",
      "visit_reminders",
      "incident_alerts",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "hcare_tool_schedule_visit",
    toolKey: "hcare_tool_schedule_visit",
    label: "Schedule Care Visit",
    capabilityKey: "visit_scheduling",
    supportedProviderKeys: ["hcare_calendar"],
    requiredPermissions: ["write:schedule"],
    retryLimit: 2,
    timeoutMs: 8000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "hcare_tool_log_visit_notes",
    toolKey: "hcare_tool_log_visit_notes",
    label: "Log Visit Documentation",
    capabilityKey: "visit_scheduling",
    supportedProviderKeys: ["hcare_calendar"],
    requiredPermissions: ["write:visit_records"],
    retryLimit: 2,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
    auditLevel: "sensitive" as const,
  },
  {
    key: "hcare_tool_generate_invoice",
    toolKey: "hcare_tool_generate_invoice",
    label: "Generate Client Invoice",
    capabilityKey: "invoice_generation",
    supportedProviderKeys: ["hcare_accounting"],
    requiredPermissions: ["write:invoices"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 20,
    auditLevel: "sensitive" as const,
  },
];

export function seedIntegrations(): void {
  for (const provider of providers) {
    providerDefinitionRegistry.register(provider);
  }
  for (const tool of tools) {
    toolDefinitionRegistry.register(tool);
  }
}
