import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "retail_provider_pos",
    providerKey: "retail_pos",
    label: "Retail Point of Sale",
    category: "payments" as const,
    supportedCapabilities: [
      "transaction_processing",
      "sales_reporting",
      "inventory_deduction",
      "loyalty_integration",
      "return_processing",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "retail_provider_inventory",
    providerKey: "retail_inventory",
    label: "Retail Inventory Management",
    category: "storage" as const,
    supportedCapabilities: [
      "inventory_tracking",
      "purchase_order_management",
      "cycle_count_support",
      "vendor_management",
      "reorder_point_management",
    ],
    authType: "api_key" as const,
  },
  {
    key: "retail_provider_crm",
    providerKey: "retail_crm",
    label: "Retail CRM & Loyalty Platform",
    category: "crm" as const,
    supportedCapabilities: [
      "customer_profiles",
      "loyalty_program_management",
      "email_marketing",
      "purchase_history",
      "segmentation",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "retail_tool_create_purchase_order",
    toolKey: "retail_tool_create_purchase_order",
    label: "Create Purchase Order",
    capabilityKey: "purchase_order_management",
    supportedProviderKeys: ["retail_inventory"],
    requiredPermissions: ["write:orders"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "retail_tool_apply_markdown",
    toolKey: "retail_tool_apply_markdown",
    label: "Apply Markdown to SKU",
    capabilityKey: "inventory_tracking",
    supportedProviderKeys: ["retail_pos", "retail_inventory"],
    requiredPermissions: ["write:pricing"],
    retryLimit: 2,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
    auditLevel: "sensitive" as const,
  },
  {
    key: "retail_tool_send_loyalty_offer",
    toolKey: "retail_tool_send_loyalty_offer",
    label: "Send Loyalty Offer",
    capabilityKey: "email_marketing",
    supportedProviderKeys: ["retail_crm", "sendgrid"],
    requiredPermissions: ["write:outreach"],
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
