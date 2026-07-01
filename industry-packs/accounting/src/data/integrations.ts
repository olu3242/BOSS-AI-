import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "acct_accounting_software",
    providerKey: "quickbooks",
    label: "Accounting Software",
    category: "accounting" as const,
    supportedCapabilities: ["general_ledger", "invoicing", "payment_processing", "financial_reporting"],
    authType: "oauth2" as const,
  },
  {
    key: "acct_crm_provider",
    providerKey: "hubspot",
    label: "CRM & Business Development",
    category: "crm" as const,
    supportedCapabilities: ["contact_management", "pipeline_tracking", "referral_tracking"],
    authType: "oauth2" as const,
  },
  {
    key: "acct_email_provider",
    providerKey: "gmail",
    label: "Email Communication",
    category: "email" as const,
    supportedCapabilities: ["send_email", "email_templates", "client_communication"],
    authType: "oauth2" as const,
  },
];

const tools = [
  {
    key: "acct_tool_send_invoice",
    toolKey: "send_invoice",
    label: "Send Client Invoice",
    capabilityKey: "invoicing",
    supportedProviderKeys: ["quickbooks"],
    requiredPermissions: ["write:invoices", "read:billing"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "acct_tool_deadline_alert",
    toolKey: "send_deadline_alert",
    label: "Send Deadline Alert",
    capabilityKey: "send_email",
    supportedProviderKeys: ["gmail"],
    requiredPermissions: ["write:communications"],
    retryLimit: 3,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
    auditLevel: "standard" as const,
  },
  {
    key: "acct_tool_generate_report",
    toolKey: "generate_financial_report",
    label: "Generate Financial Report",
    capabilityKey: "financial_reporting",
    supportedProviderKeys: ["quickbooks"],
    requiredPermissions: ["read:financial_data", "write:reports"],
    retryLimit: 2,
    timeoutMs: 30000,
    rateLimitPerMinute: 10,
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
