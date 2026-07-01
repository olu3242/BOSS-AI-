import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "rest_provider_pos",
    providerKey: "rest_pos",
    label: "Point of Sale System",
    category: "payments" as const,
    supportedCapabilities: [
      "order_management",
      "payment_processing",
      "sales_reporting",
      "menu_management",
      "tip_processing",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "rest_provider_reservation",
    providerKey: "rest_reservation",
    label: "Reservation Management Platform",
    category: "calendar" as const,
    supportedCapabilities: [
      "reservation_booking",
      "waitlist_management",
      "guest_profiles",
      "confirmation_messaging",
    ],
    authType: "api_key" as const,
  },
  {
    key: "rest_provider_inventory",
    providerKey: "rest_inventory",
    label: "Restaurant Inventory Management",
    category: "storage" as const,
    supportedCapabilities: [
      "inventory_tracking",
      "purchase_order_management",
      "waste_logging",
      "cost_of_goods_calculation",
      "par_level_management",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "rest_tool_send_reservation_reminder",
    toolKey: "rest_tool_send_reservation_reminder",
    label: "Send Reservation Reminder",
    capabilityKey: "confirmation_messaging",
    supportedProviderKeys: ["rest_reservation", "twilio", "sendgrid"],
    requiredPermissions: ["write:outreach"],
    retryLimit: 2,
    timeoutMs: 5000,
    rateLimitPerMinute: 120,
    auditLevel: "standard" as const,
  },
  {
    key: "rest_tool_log_waste",
    toolKey: "rest_tool_log_waste",
    label: "Log Food Waste Entry",
    capabilityKey: "waste_logging",
    supportedProviderKeys: ["rest_inventory"],
    requiredPermissions: ["write:inventory"],
    retryLimit: 3,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
    auditLevel: "standard" as const,
  },
  {
    key: "rest_tool_get_daily_sales",
    toolKey: "rest_tool_get_daily_sales",
    label: "Get Daily Sales Report",
    capabilityKey: "sales_reporting",
    supportedProviderKeys: ["rest_pos"],
    requiredPermissions: ["read:financials"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 30,
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
