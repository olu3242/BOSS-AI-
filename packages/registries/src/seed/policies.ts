import { policyRegistry } from "../registries/policy.js";

/**
 * Platform-wide policy catalog. Pack- and workflow-specific policies
 * reference these categories rather than inventing new ones.
 */
const policies = [
  { key: "approval.workflow_execution", label: "Workflow Execution Approval", category: "approval" as const, description: "Defines when a workflow step requires human approval before executing." },
  { key: "security.tenant_isolation", label: "Tenant Isolation", category: "security" as const, description: "All data access must be scoped to the authenticated org_id." },
  { key: "privacy.pii_handling", label: "PII Handling", category: "privacy" as const, description: "Personally identifiable information must be encrypted and access-logged." },
  { key: "execution.token_budget", label: "AI Token Budget", category: "execution" as const, description: "Caps AI token usage per organization per billing period." },
  { key: "escalation.owner_notification", label: "Owner Escalation", category: "escalation" as const, description: "Defines when an AI employee must escalate to the business owner." },
] as const;

export function seedPolicyRegistry(): void {
  for (const policy of policies) {
    policyRegistry.register(policy);
  }
}
