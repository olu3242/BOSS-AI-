import { providerDefinitionRegistry, toolDefinitionRegistry } from "@boss/registries";

const providers = [
  {
    key: "dental_provider_pms",
    providerKey: "dental_pms",
    label: "Practice Management System",
    category: "crm" as const,
    supportedCapabilities: [
      "patient_scheduling",
      "treatment_plan_management",
      "billing_and_claims",
      "recall_management",
      "reporting",
    ],
    authType: "oauth2" as const,
  },
  {
    key: "dental_provider_digital_forms",
    providerKey: "dental_digital_forms",
    label: "Digital Patient Forms",
    category: "storage" as const,
    supportedCapabilities: [
      "intake_forms",
      "health_history",
      "consent_forms",
      "hipaa_authorization",
    ],
    authType: "api_key" as const,
  },
  {
    key: "dental_provider_insurance_portal",
    providerKey: "dental_insurance_portal",
    label: "Insurance Eligibility Portal",
    category: "payments" as const,
    supportedCapabilities: [
      "eligibility_verification",
      "benefit_details",
      "claim_submission",
      "claim_status_tracking",
    ],
    authType: "api_key" as const,
  },
];

const tools = [
  {
    key: "dental_tool_verify_insurance",
    toolKey: "dental_tool_verify_insurance",
    label: "Verify Insurance Eligibility",
    capabilityKey: "eligibility_verification",
    supportedProviderKeys: ["dental_insurance_portal"],
    requiredPermissions: ["read:insurance"],
    retryLimit: 3,
    timeoutMs: 10000,
    rateLimitPerMinute: 60,
    auditLevel: "standard" as const,
  },
  {
    key: "dental_tool_send_recall",
    toolKey: "dental_tool_send_recall",
    label: "Send Recall Message",
    capabilityKey: "patient_outreach",
    supportedProviderKeys: ["twilio", "sendgrid"],
    requiredPermissions: ["write:outreach"],
    retryLimit: 2,
    timeoutMs: 5000,
    rateLimitPerMinute: 120,
    auditLevel: "standard" as const,
  },
  {
    key: "dental_tool_schedule_appointment",
    toolKey: "dental_tool_schedule_appointment",
    label: "Schedule Appointment",
    capabilityKey: "patient_scheduling",
    supportedProviderKeys: ["dental_pms"],
    requiredPermissions: ["write:appointments"],
    retryLimit: 2,
    timeoutMs: 8000,
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
