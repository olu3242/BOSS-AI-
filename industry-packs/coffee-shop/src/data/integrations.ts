import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "cafe_pos_accounting",
    providerKey: "cafe_pos_accounting",
    label: "POS Accounting Integration",
    category: "accounting" as const,
    supportedCapabilities: [
      "sales_reporting",
      "revenue_tracking",
      "labor_cost_tracking",
      "cogs_calculation",
      "daily_reconciliation",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "cafe_email_marketing",
    providerKey: "cafe_email_marketing",
    label: "Email Marketing",
    category: "email" as const,
    supportedCapabilities: [
      "campaign_sends",
      "loyalty_communications",
      "promotional_emails",
      "customer_segmentation",
    ],
    authType: "api_key" as const,
  },
  {
    key: "cafe_sms_notifications",
    providerKey: "cafe_sms_notifications",
    label: "SMS Notifications",
    category: "sms" as const,
    supportedCapabilities: [
      "flash_promotions",
      "loyalty_alerts",
      "order_status_updates",
      "supply_alerts",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "cafe_tool_sales_report",
    toolKey: "cafe_tool_sales_report",
    label: "Sales Reporting",
    capabilityKey: "sales_reporting",
    supportedProviderKeys: ["cafe_pos_accounting"],
    requiredPermissions: ["read:pos_data"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 30,
    auditLevel: "standard" as const,
  },
  {
    key: "cafe_tool_loyalty_enroll",
    toolKey: "cafe_tool_loyalty_enroll",
    label: "Loyalty Enrollment",
    capabilityKey: "customer_segmentation",
    supportedProviderKeys: ["cafe_email_marketing", "cafe_sms_notifications"],
    requiredPermissions: ["write:loyalty_data", "write:campaigns"],
    retryLimit: 2,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
    auditLevel: "standard" as const,
  },
  {
    key: "cafe_tool_inventory_alert",
    toolKey: "cafe_tool_inventory_alert",
    label: "Inventory Alert",
    capabilityKey: "supply_alerts",
    supportedProviderKeys: ["cafe_sms_notifications"],
    requiredPermissions: ["read:inventory", "write:alerts"],
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
