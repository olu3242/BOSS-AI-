import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "legal_billing_accounting",
    providerKey: "clio_accounting",
    label: "Legal Billing & Accounting",
    category: "accounting" as const,
    supportedCapabilities: ["invoice_management", "payment_processing", "trust_accounting", "billing_reports"],
    authType: "oauth2" as const,
  },
  {
    key: "legal_crm_provider",
    providerKey: "clio_crm",
    label: "Legal CRM",
    category: "crm" as const,
    supportedCapabilities: ["contact_management", "matter_tracking", "referral_tracking", "client_portal"],
    authType: "oauth2" as const,
  },
  {
    key: "legal_email_provider",
    providerKey: "gmail",
    label: "Email Communication",
    category: "email" as const,
    supportedCapabilities: ["send_email", "email_templates", "client_communication"],
    authType: "oauth2" as const,
  },
];

const tools = [
  {
    key: "legal_tool_send_invoice",
    toolKey: "send_invoice",
    label: "Send Client Invoice",
    capabilityKey: "invoice_management",
    supportedProviderKeys: ["clio_accounting"],
    requiredPermissions: ["write:invoices", "read:billing"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "legal_tool_conflict_check",
    toolKey: "run_conflict_check",
    label: "Run Conflict Check",
    capabilityKey: "contact_management",
    supportedProviderKeys: ["clio_crm"],
    requiredPermissions: ["read:clients", "read:matters"],
    retryLimit: 2,
    timeoutMs: 8000,
    rateLimitPerMinute: 20,
    auditLevel: "sensitive" as const,
  },
  {
    key: "legal_tool_send_status_update",
    toolKey: "send_matter_update",
    label: "Send Matter Status Update",
    capabilityKey: "send_email",
    supportedProviderKeys: ["gmail"],
    requiredPermissions: ["write:communications", "read:matters"],
    retryLimit: 3,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
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
