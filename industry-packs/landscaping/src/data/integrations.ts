import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "lscape_crm_provider",
    providerKey: "lscape_crm",
    label: "Landscaping CRM",
    category: "crm" as const,
    supportedCapabilities: [
      "customer_management",
      "estimate_tracking",
      "job_history",
      "lead_management",
      "reporting",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "lscape_accounting_provider",
    providerKey: "lscape_accounting",
    label: "Accounting & Invoicing",
    category: "accounting" as const,
    supportedCapabilities: [
      "invoice_generation",
      "payment_collection",
      "expense_tracking",
      "financial_reporting",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "lscape_sms_provider",
    providerKey: "lscape_sms",
    label: "SMS Notifications",
    category: "sms" as const,
    supportedCapabilities: [
      "job_confirmation_sms",
      "crew_dispatch_sms",
      "customer_follow_up_sms",
      "payment_reminder_sms",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "lscape_tool_schedule_job",
    toolKey: "lscape_tool_schedule_job",
    label: "Schedule Job",
    capabilityKey: "job_scheduling",
    supportedProviderKeys: ["lscape_crm"],
    requiredPermissions: ["write:schedule", "read:crews"],
    retryLimit: 2,
    timeoutMs: 8000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "lscape_tool_generate_invoice",
    toolKey: "lscape_tool_generate_invoice",
    label: "Generate Invoice",
    capabilityKey: "invoice_generation",
    supportedProviderKeys: ["lscape_accounting"],
    requiredPermissions: ["write:invoices", "read:jobs"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 60,
    auditLevel: "sensitive" as const,
  },
  {
    key: "lscape_tool_notify_customer",
    toolKey: "lscape_tool_notify_customer",
    label: "Notify Customer",
    capabilityKey: "customer_follow_up_sms",
    supportedProviderKeys: ["lscape_sms"],
    requiredPermissions: ["write:notifications", "read:customers"],
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
