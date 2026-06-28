import { registerAgent } from "@boss/registries";
import type {
  Agent,
  AgentPriority,
  DepartmentId,
  EventReference,
  ExecutionMode,
  WorkflowReference,
} from "@boss/registries";
import { GENERAL_SMB_PACK_VERSION } from "../version.js";
import { aiEmployees } from "./aiEmployees.js";

const lifecycleEvents = [
  { id: "agent.created", key: "agent.created" },
  { id: "agent.started", key: "agent.started" },
  { id: "agent.completed", key: "agent.completed" },
] as const satisfies readonly EventReference[];

interface AgentBusinessMetadata {
  readonly department: DepartmentId;
  readonly departmentName: string;
  readonly businessDomain: string;
  readonly businessDomainName: string;
  readonly primaryRole: string;
  readonly secondaryRoles: readonly string[];
  readonly businessOutcome: string;
  readonly businessObjectives: readonly string[];
  readonly priority: AgentPriority;
  readonly supportedChannels: readonly string[];
  readonly tags: readonly string[];
}

const businessMetadataByAgent = {
  ceo_advisor: {
    department: "executive",
    departmentName: "Executive",
    businessDomain: "business_strategy",
    businessDomainName: "Business Strategy",
    primaryRole: "Executive Advisor",
    secondaryRoles: ["Constraint Analyst", "Priority Advisor"],
    businessOutcome: "The owner consistently acts on the highest-leverage priority.",
    businessObjectives: ["Improve business health", "Maintain focus on growth constraints"],
    priority: "critical",
    supportedChannels: ["dashboard"],
    tags: ["executive", "strategy", "prioritization"],
  },
  ai_front_desk: {
    department: "support",
    departmentName: "Support",
    businessDomain: "customer_operations",
    businessDomainName: "Customer Operations",
    primaryRole: "Inbound Service Coordinator",
    secondaryRoles: ["Lead Intake Coordinator", "Scheduling Coordinator"],
    businessOutcome: "Inbound customers receive a timely response and correct routing.",
    businessObjectives: ["Reduce response time", "Capture complete lead details"],
    priority: "high",
    supportedChannels: ["messaging", "scheduling"],
    tags: ["inbound", "triage", "lead_capture"],
  },
  ai_follow_up_assistant: {
    department: "sales",
    departmentName: "Sales",
    businessDomain: "lead_engagement",
    businessDomainName: "Lead Engagement",
    primaryRole: "Follow-Up Coordinator",
    secondaryRoles: ["Lead Re-engagement Specialist"],
    businessOutcome: "Leads and customers receive consistent, timely follow-up.",
    businessObjectives: ["Improve lead conversion", "Recover inactive opportunities"],
    priority: "high",
    supportedChannels: ["messaging"],
    tags: ["follow_up", "lead_management", "re_engagement"],
  },
  ai_operations_coordinator: {
    department: "operations",
    departmentName: "Operations",
    businessDomain: "business_operations",
    businessDomainName: "Business Operations",
    primaryRole: "Operations Coordinator",
    secondaryRoles: ["Scheduling Coordinator", "Task Coordinator"],
    businessOutcome: "Daily work is coordinated and operational bottlenecks are visible.",
    businessObjectives: ["Reduce administrative workload", "Improve task completion"],
    priority: "high",
    supportedChannels: ["scheduling", "task_management"],
    tags: ["operations", "scheduling", "coordination"],
  },
  ai_review_manager: {
    department: "customer_success",
    departmentName: "Customer Success",
    businessDomain: "reputation_management",
    businessDomainName: "Reputation Management",
    primaryRole: "Review Manager",
    secondaryRoles: ["Reputation Coordinator"],
    businessOutcome: "Customer feedback strengthens reputation and receives appropriate follow-up.",
    businessObjectives: ["Increase review volume", "Protect customer trust"],
    priority: "medium",
    supportedChannels: ["review_platform", "messaging"],
    tags: ["reviews", "reputation", "customer_feedback"],
  },
  ai_collections_assistant: {
    department: "finance",
    departmentName: "Finance",
    businessDomain: "accounts_receivable",
    businessDomainName: "Accounts Receivable",
    primaryRole: "Collections Coordinator",
    secondaryRoles: ["Invoice Follow-Up Specialist"],
    businessOutcome: "Outstanding invoices receive consistent follow-up and timely escalation.",
    businessObjectives: ["Reduce outstanding receivables", "Improve cash-flow visibility"],
    priority: "high",
    supportedChannels: ["billing", "messaging"],
    tags: ["collections", "billing", "cash_flow"],
  },
  ai_reporting_analyst: {
    department: "analytics",
    departmentName: "Analytics",
    businessDomain: "business_analytics",
    businessDomainName: "Business Analytics",
    primaryRole: "Reporting Analyst",
    secondaryRoles: ["KPI Analyst"],
    businessOutcome: "Business performance is converted into clear, actionable reporting.",
    businessObjectives: ["Improve KPI visibility", "Surface material performance changes"],
    priority: "medium",
    supportedChannels: ["analytics", "dashboard"],
    tags: ["reporting", "analytics", "kpi"],
  },
} as const satisfies Record<
  (typeof aiEmployees)[number]["key"],
  AgentBusinessMetadata
>;

const workflowKeysByAgent = {
  ceo_advisor: ["administrative_automation"],
  ai_front_desk: ["appointment_reminder"],
  ai_follow_up_assistant: ["lead_follow_up_recovery", "customer_re_engagement"],
  ai_operations_coordinator: ["appointment_reminder", "administrative_automation"],
  ai_review_manager: ["review_request"],
  ai_collections_assistant: ["invoice_follow_up"],
  ai_reporting_analyst: [],
} as const satisfies Record<
  (typeof aiEmployees)[number]["key"],
  readonly string[]
>;

const triggerByWorkflow = {
  lead_follow_up_recovery: "event",
  appointment_reminder: "schedule",
  customer_re_engagement: "schedule",
  invoice_follow_up: "schedule",
  review_request: "event",
  administrative_automation: "manual",
} as const satisfies Record<string, ExecutionMode>;

function workflowReferences(
  agentKey: (typeof aiEmployees)[number]["key"],
): readonly WorkflowReference[] {
  return workflowKeysByAgent[agentKey].map((key) => ({ id: key, key }));
}

function executionModes(
  workflows: readonly WorkflowReference[],
): readonly ExecutionMode[] {
  return Array.from(
    new Set(
      workflows.map(
        (workflow) =>
          triggerByWorkflow[workflow.key as keyof typeof triggerByWorkflow],
      ),
    ),
  );
}

export const agents: readonly Agent[] = Object.freeze(
  aiEmployees.map((employee) => {
    const metadata = businessMetadataByAgent[employee.key];
    const workflows = workflowReferences(employee.key);
    const modes = executionModes(workflows);
    const businessDomain = {
      id: metadata.businessDomain,
      displayName: metadata.businessDomainName,
      key: metadata.businessDomain,
    };
    const capabilities = employee.capabilities.map((key) => ({ id: key, key }));

    return {
      id: employee.key,
      displayName: employee.label,
      key: employee.key,
      label: employee.label,
      mission: employee.mission,
      responsibilities: employee.responsibilities,
      department: {
        id: metadata.department,
        displayName: metadata.departmentName,
        key: metadata.department,
        label: metadata.departmentName,
      },
      businessDomain,
      primaryRole: metadata.primaryRole,
      secondaryRoles: metadata.secondaryRoles,
      businessOutcome: metadata.businessOutcome,
      businessOutcomeId: `${employee.key}.outcome`,
      businessObjectives: metadata.businessObjectives,
      businessObjectiveIds: metadata.businessObjectives.map(
        (_, index) => `${employee.key}.objective.${index + 1}`,
      ),
      coreResponsibilities: employee.responsibilities,
      primaryKPIs: employee.kpis.slice(0, 1),
      secondaryKPIs: employee.kpis.slice(1),
      priority: metadata.priority,
      owner: {
        id: "business_owner",
        displayName: "Business Owner",
      },
      supportedIndustries: ["general_smb"],
      supportedBusinessSizes: ["micro", "small", "medium"],
      supportedChannels: metadata.supportedChannels,
      executionMode: modes,
      activationConditions: workflows.map(
        (workflow) => `workflow:${workflow.id}`,
      ),
      capabilities,
      requiredCapabilities: capabilities,
      skills: [],
      workflows,
      triggers: modes.map((key) => ({ id: key, key })),
      automations: [],
      notificationChannels: [],
      businessDomains: [businessDomain],
      executionModes: modes,
      estimatedExecutionTime: {
        value: null,
        unit: "minutes",
        confidence: "unknown",
      },
      estimatedOperationalCost: {
        amount: null,
        currency: "USD",
        basis: "unknown",
      },
      escalationTargets: employee.escalationRules,
      documentation: {
        summary: employee.mission,
        sourcePaths: [
          "industry-packs/general-smb/src/data/aiEmployees.ts",
          "industry-packs/general-smb/src/data/agents.ts",
        ],
      },
      lifecycle: employee.lifecycle,
      dependencies: {
        tools: employee.requiredTools,
        permissions: employee.permissions,
        agents: [],
      },
      health: "not_registered",
      version: {
        current: "0.2.0",
        sourceVersion: GENERAL_SMB_PACK_VERSION,
      },
      status: "defined",
      registrationState: "registered",
      deploymentState: "not_deployed",
      tags: metadata.tags,
      prompts: [
        {
          id: `${employee.key}.system`,
          key: `${employee.key}.system`,
          version: "unversioned",
        },
      ],
      events: lifecycleEvents,
      registry: {
        schemaVersion: "2",
        source: "general-smb",
        authoritative: true,
      },
    } as const satisfies Agent;
  }),
);

export function seedAgents(): void {
  for (const agent of agents) {
    registerAgent(agent);
  }
}
