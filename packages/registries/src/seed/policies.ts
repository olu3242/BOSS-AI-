import { policyRegistry } from "../registries/policy.js";

/**
 * Platform-wide policy catalog. Pack- and workflow-specific policies
 * reference these categories rather than inventing new ones.
 */
const policies = [
  { key: "approval.workflow_execution", label: "Workflow Execution Approval", category: "approval" as const, description: "Defines when a workflow step requires human approval before executing.", owner: "Governance", approval: "human_required" as const, riskLevel: "high" as const },
  { key: "security.tenant_isolation", label: "Tenant Isolation", category: "security" as const, description: "All data access must be scoped to the authenticated org_id.", owner: "Security", approval: "human_required" as const, riskLevel: "high" as const },
  { key: "execution.business_context_required", label: "Published Business Context Required", category: "execution" as const, description: "Workflow and AI execution requires a tenant-matched, published canonical Business Context.", owner: "Platform", approval: "not_required" as const, riskLevel: "high" as const },
  { key: "execution.graph_resolution_required", label: "Graph Resolution Required", category: "execution" as const, description: "Business relationship access must use a tenant-matched, published Business Knowledge Graph through the Graph Resolution Engine.", owner: "Platform", approval: "not_required" as const, riskLevel: "high" as const },
  { key: "execution.semantic_context_required", label: "Semantic Context Required", category: "execution" as const, description: "Application consumers must resolve business meaning through the tenant-scoped Business Semantic Layer.", owner: "Platform", approval: "not_required" as const, riskLevel: "high" as const },
  { key: "execution.business_query_required", label: "Canonical Business Query Required", category: "execution" as const, description: "Downstream consumers must retrieve business information through tenant-scoped, registered BQIL queries.", owner: "Platform", approval: "not_required" as const, riskLevel: "high" as const },
  { key: "security.capability_signature_required", label: "Capability Signature Required", category: "security" as const, description: "Capability packs must carry a trusted Ed25519 signature before publication or installation.", owner: "Security", approval: "human_required" as const, riskLevel: "high" as const },
  { key: "execution.capability_compatibility_required", label: "Capability Compatibility Required", category: "execution" as const, description: "Capability packs must satisfy platform, runtime, dependency, permission, and registry contracts before activation.", owner: "Platform", approval: "not_required" as const, riskLevel: "high" as const },
  { key: "privacy.pii_handling", label: "PII Handling", category: "privacy" as const, description: "Personally identifiable information must be encrypted and access-logged.", owner: "Security", approval: "human_required" as const, riskLevel: "high" as const },
  { key: "execution.token_budget", label: "AI Token Budget", category: "execution" as const, description: "Caps AI token usage per organization per billing period.", owner: "Platform", approval: "human_required" as const, riskLevel: "medium" as const },
  { key: "escalation.owner_notification", label: "Owner Escalation", category: "escalation" as const, description: "Defines when an AI employee must escalate to the business owner.", owner: "Governance", approval: "human_required" as const, riskLevel: "medium" as const },
] as const;

export function seedPolicyRegistry(): void {
  for (const policy of policies) {
    policyRegistry.register({
      id: policy.key,
      displayName: policy.label,
      key: policy.key,
      label: policy.label,
      category: policy.category,
      description: policy.description,
      owner: policy.owner,
      approval: policy.approval,
      riskLevel: policy.riskLevel,
      changeControl: "pull_request",
      lifecycle: "active",
      documentation: "packages/registries/src/seed/policies.ts",
      version: "1.0.0",
      tags: [policy.category],
    });
  }
}
