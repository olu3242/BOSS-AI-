import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "clean_crm_provider",
    providerKey: "clean_crm",
    label: "Cleaning CRM",
    category: "crm" as const,
    supportedCapabilities: [
      "client_management",
      "job_history",
      "recurring_booking_management",
      "quote_management",
      "reporting",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "clean_accounting_provider",
    providerKey: "clean_accounting",
    label: "Accounting System",
    category: "accounting" as const,
    supportedCapabilities: [
      "invoice_generation",
      "payment_collection",
      "expense_tracking",
      "payroll",
      "financial_reporting",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "clean_sms_provider",
    providerKey: "clean_sms",
    label: "SMS & Notifications",
    category: "sms" as const,
    supportedCapabilities: [
      "job_reminders",
      "booking_confirmations",
      "cleaner_dispatch_notifications",
      "review_requests",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "clean_tool_schedule_job",
    toolKey: "clean_tool_schedule_job",
    label: "Schedule Cleaning Job",
    capabilityKey: "client_management",
    supportedProviderKeys: ["clean_crm"],
    requiredPermissions: ["write:schedule", "read:cleaner_availability"],
    retryLimit: 2,
    timeoutMs: 8000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "clean_tool_generate_invoice",
    toolKey: "clean_tool_generate_invoice",
    label: "Generate Invoice",
    capabilityKey: "invoice_generation",
    supportedProviderKeys: ["clean_accounting"],
    requiredPermissions: ["write:invoices", "read:jobs"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 60,
    auditLevel: "sensitive" as const,
  },
  {
    key: "clean_tool_quality_checklist",
    toolKey: "clean_tool_quality_checklist",
    label: "Submit Quality Checklist",
    capabilityKey: "job_history",
    supportedProviderKeys: ["clean_crm"],
    requiredPermissions: ["write:inspections", "read:jobs"],
    retryLimit: 2,
    timeoutMs: 5000,
    rateLimitPerMinute: 120,
    auditLevel: "standard" as const,
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
