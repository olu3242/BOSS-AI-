import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

export function seedIntegrations(): void {
  // Payment provider for on-site job payment collection
  providerDefinitionRegistry.register({
    key: "hs_provider_stripe_field",
    providerKey: "stripe_field",
    label: "Stripe (Field Payments)",
    category: "payments",
    supportedCapabilities: ["payment_processing"],
    authType: "api_key",
  });

  // SMS for dispatch notifications and customer updates
  providerDefinitionRegistry.register({
    key: "hs_provider_twilio_dispatch",
    providerKey: "twilio_dispatch",
    label: "Twilio (Dispatch SMS)",
    category: "sms",
    supportedCapabilities: ["communication"],
    authType: "api_key",
  });

  // Calendar for job scheduling
  providerDefinitionRegistry.register({
    key: "hs_provider_google_calendar",
    providerKey: "google_calendar_field",
    label: "Google Calendar (Field Scheduling)",
    category: "calendar",
    supportedCapabilities: ["scheduling"],
    authType: "oauth2",
  });

  // Accounting integration for invoice sync
  providerDefinitionRegistry.register({
    key: "hs_provider_quickbooks",
    providerKey: "quickbooks_field",
    label: "QuickBooks (Field Service Accounting)",
    category: "accounting",
    supportedCapabilities: ["accounting"],
    authType: "oauth2",
  });

  // Tool: dispatch notification via SMS
  toolDefinitionRegistry.register({
    key: "hs_tool_dispatch_sms",
    toolKey: "dispatch_sms",
    label: "Dispatch SMS Notification",
    capabilityKey: "communication",
    supportedProviderKeys: ["twilio_dispatch"],
    requiredPermissions: ["write:notifications"],
    retryLimit: 3,
    timeoutMs: 5000,
    rateLimitPerMinute: 60,
    auditLevel: "standard",
  });

  // Tool: schedule job on calendar
  toolDefinitionRegistry.register({
    key: "hs_tool_schedule_job",
    toolKey: "schedule_job",
    label: "Schedule Job",
    capabilityKey: "scheduling",
    supportedProviderKeys: ["google_calendar_field"],
    requiredPermissions: ["write:calendar"],
    retryLimit: 2,
    timeoutMs: 8000,
    rateLimitPerMinute: 30,
    auditLevel: "standard",
  });

  // Tool: collect job payment
  toolDefinitionRegistry.register({
    key: "hs_tool_collect_payment",
    toolKey: "collect_job_payment",
    label: "Collect Job Payment",
    capabilityKey: "payment_processing",
    supportedProviderKeys: ["stripe_field"],
    requiredPermissions: ["write:payments"],
    retryLimit: 3,
    timeoutMs: 15000,
    rateLimitPerMinute: 10,
    auditLevel: "sensitive",
  });
}
