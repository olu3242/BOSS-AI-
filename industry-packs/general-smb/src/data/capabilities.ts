import { capabilityRegistry } from "@boss/registries";
import type {
  CapabilityCategory,
  CapabilityComplexity,
  CapabilityEntry,
  CapabilityExecutionMode,
  CapabilityRiskLevel,
} from "@boss/registries";
import { aiEmployees } from "./aiEmployees.js";

interface CapabilitySource {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: CapabilityCategory;
  readonly subcategory: string;
  readonly businessDomain: string;
  readonly executionMode: readonly CapabilityExecutionMode[];
  readonly riskLevel: CapabilityRiskLevel;
  readonly complexity: CapabilityComplexity;
  readonly owner: string;
  readonly tags: readonly string[];
}

const capabilitySources = [
  { id: "sales", displayName: "Sales", description: "Pipeline, quoting, and closing new business.", category: "sales", subcategory: "pipeline", businessDomain: "revenue_growth", executionMode: ["manual", "event"], riskLevel: "medium", complexity: "medium", owner: "Sales", tags: ["pipeline", "revenue"] },
  { id: "marketing", displayName: "Marketing", description: "Campaigns, content, and brand visibility.", category: "marketing", subcategory: "campaigns", businessDomain: "demand_generation", executionMode: ["manual", "schedule"], riskLevel: "medium", complexity: "medium", owner: "Marketing", tags: ["campaigns", "brand"] },
  { id: "lead_management", displayName: "Lead Management", description: "Capturing and qualifying inbound interest.", category: "crm", subcategory: "leads", businessDomain: "lead_engagement", executionMode: ["event", "schedule"], riskLevel: "medium", complexity: "medium", owner: "Sales", tags: ["leads", "qualification"] },
  { id: "customer_management", displayName: "Customer Management", description: "Tracking customer relationships and history.", category: "crm", subcategory: "customers", businessDomain: "customer_operations", executionMode: ["manual", "event"], riskLevel: "medium", complexity: "medium", owner: "Customer Success", tags: ["customers", "relationships"] },
  { id: "scheduling", displayName: "Scheduling", description: "Appointment and resource booking.", category: "scheduling", subcategory: "appointments", businessDomain: "business_operations", executionMode: ["manual", "event", "schedule"], riskLevel: "medium", complexity: "medium", owner: "Operations", tags: ["appointments", "calendar"] },
  { id: "operations", displayName: "Operations", description: "Day-to-day service or production delivery.", category: "operations", subcategory: "service_delivery", businessDomain: "business_operations", executionMode: ["manual", "event", "schedule"], riskLevel: "medium", complexity: "high", owner: "Operations", tags: ["delivery", "coordination"] },
  { id: "communication", displayName: "Communication", description: "Inbound/outbound customer messaging.", category: "communications", subcategory: "customer_messaging", businessDomain: "customer_operations", executionMode: ["event", "schedule"], riskLevel: "medium", complexity: "medium", owner: "Customer Success", tags: ["messaging", "customer"] },
  { id: "reviews", displayName: "Reviews", description: "Reputation and review management.", category: "customer_success", subcategory: "reputation", businessDomain: "reputation_management", executionMode: ["event"], riskLevel: "medium", complexity: "low", owner: "Customer Success", tags: ["reviews", "reputation"] },
  { id: "finance", displayName: "Finance", description: "Revenue, expenses, and profitability tracking.", category: "finance", subcategory: "financial_management", businessDomain: "financial_operations", executionMode: ["manual", "schedule"], riskLevel: "high", complexity: "high", owner: "Finance", tags: ["revenue", "profitability"] },
  { id: "billing", displayName: "Billing", description: "Invoicing and payment collection.", category: "finance", subcategory: "accounts_receivable", businessDomain: "accounts_receivable", executionMode: ["event", "schedule"], riskLevel: "high", complexity: "medium", owner: "Finance", tags: ["invoices", "collections"] },
  { id: "reporting", displayName: "Reporting", description: "Business performance visibility.", category: "reporting", subcategory: "business_reporting", businessDomain: "business_analytics", executionMode: ["manual", "schedule"], riskLevel: "low", complexity: "medium", owner: "Analytics", tags: ["kpi", "visibility"] },
  { id: "task_management", displayName: "Task Management", description: "Internal work tracking.", category: "operations", subcategory: "work_management", businessDomain: "business_operations", executionMode: ["manual", "event"], riskLevel: "low", complexity: "medium", owner: "Operations", tags: ["tasks", "accountability"] },
  { id: "documents", displayName: "Documents", description: "Contracts, proposals, and file management.", category: "documents", subcategory: "business_documents", businessDomain: "knowledge_management", executionMode: ["manual", "event"], riskLevel: "high", complexity: "medium", owner: "Administration", tags: ["files", "records"] },
  { id: "notifications", displayName: "Notifications", description: "Alerts to staff and customers.", category: "notifications", subcategory: "alerts", businessDomain: "business_operations", executionMode: ["event", "schedule"], riskLevel: "medium", complexity: "low", owner: "Operations", tags: ["alerts", "messaging"] },
  { id: "team_collaboration", displayName: "Team Collaboration", description: "Coordination across employees.", category: "operations", subcategory: "collaboration", businessDomain: "business_operations", executionMode: ["manual", "event"], riskLevel: "low", complexity: "low", owner: "Operations", tags: ["team", "coordination"] },
  { id: "automation", displayName: "Automation", description: "Governed orchestration of repeatable business processes.", category: "operations", subcategory: "workflow_automation", businessDomain: "operational_excellence", executionMode: ["event", "schedule"], riskLevel: "medium", complexity: "high", owner: "Operations", tags: ["automation", "orchestration"] },
] as const satisfies readonly CapabilitySource[];

function permissionsFor(capabilityId: string): readonly string[] {
  return Array.from(
    new Set(
      aiEmployees
        .filter((employee) =>
          employee.capabilities.some((capability) => capability === capabilityId),
        )
        .flatMap((employee) => employee.permissions),
    ),
  );
}

export const capabilities: readonly CapabilityEntry[] = Object.freeze(
  capabilitySources.map((source) => ({
    id: source.id,
    name: source.id,
    displayName: source.displayName,
    key: source.id,
    label: source.displayName,
    description: source.description,
    category: source.category,
    subcategory: source.subcategory,
    businessDomain: source.businessDomain,
    supportedIndustries: ["general_smb"],
    requiredInputs: [],
    generatedOutputs: [],
    dependencies: [],
    requiredPermissions: permissionsFor(source.id),
    executionMode: source.executionMode,
    riskLevel: source.riskLevel,
    complexity: source.complexity,
    owner: source.owner,
    version: "1.0.0",
    status: "active" as const,
    tags: source.tags,
  })),
);

export function seedCapabilities(): void {
  for (const capability of capabilities) {
    capabilityRegistry.register(capability);
  }
}
