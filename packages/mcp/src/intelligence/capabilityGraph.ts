import type { BusinessMriResponse, CapabilityMaturity } from "@boss/types";
import { asBoolean, asNumber, asString, asStringArray, toResponseMap } from "./responseMap.js";
import type { DerivedBusinessDna } from "./businessDna.js";

export interface DerivedCapability {
  capabilityKey: string;
  currentMaturity: CapabilityMaturity;
  businessImportance: "low" | "medium" | "high" | "critical";
  automationPotential: "low" | "medium" | "high";
  dependencies: string[];
  owner: string;
}

const DEPENDENCIES: Record<string, string[]> = {
  lead_management: ["communication"],
  scheduling: [],
  customer_management: ["communication"],
  finance: [],
  operations: ["task_management"],
  reporting: ["finance"],
  communication: [],
  marketing: ["communication"],
  task_management: [],
};

const AUTOMATION_POTENTIAL: Record<DerivedBusinessDna["automationReadiness"], "low" | "medium" | "high"> = {
  low: "low",
  moderate: "medium",
  high: "high",
  very_high: "high",
};

/**
 * Deterministic capability maturity evaluation from MRI responses and the
 * already-derived Business DNA. No AI reasoning — fixed lookup tables only.
 */
export function evaluateCapabilities(
  responses: BusinessMriResponse[],
  dna: DerivedBusinessDna,
): DerivedCapability[] {
  const map = toResponseMap(responses);
  const goalPriorities = asStringArray(map, "goals.priorities");
  const automationPotential = AUTOMATION_POTENTIAL[dna.automationReadiness];

  const importanceFor = (capabilityKey: string, relatedGoal: string): "low" | "medium" | "high" | "critical" =>
    goalPriorities.includes(relatedGoal) ? "high" : "medium";

  const followUp = asString(map, "sales.follow_up_process");
  const leadMaturity: Record<string, CapabilityMaturity> = {
    none: "absent",
    manual: "ad_hoc",
    semi_automated: "developing",
    automated: "managed",
  };

  const scheduling = asString(map, "operations.scheduling");
  const schedulingMaturity: Record<string, CapabilityMaturity> = {
    paper: "ad_hoc",
    spreadsheet: "developing",
    software: "managed",
  };

  const hasCrm = asBoolean(map, "technology.crm");
  const repeatBusiness = asNumber(map, "customers.repeat_business");
  const customerMaturity: CapabilityMaturity = hasCrm
    ? repeatBusiness >= 4
      ? "managed"
      : "developing"
    : "absent";

  const invoicing = asString(map, "finance.invoicing");
  const financeMaturity: Record<string, CapabilityMaturity> = {
    manual: "ad_hoc",
    spreadsheet: "developing",
    software: "managed",
  };

  const processDocumented = asBoolean(map, "operations.process_documentation");
  const teamResponsibilities = asString(map, "operations.team_responsibilities");
  const operationsMaturity: CapabilityMaturity =
    teamResponsibilities === "documented" ? "managed" : processDocumented ? "developing" : "ad_hoc";

  const cashFlowVisibility = asNumber(map, "finance.cash_flow_visibility");
  const reportingMaturity: CapabilityMaturity =
    cashFlowVisibility >= 4 ? "managed" : cashFlowVisibility >= 2 ? "developing" : "ad_hoc";

  const communicationChannels = asStringArray(map, "customers.communication");
  const communicationMaturity: CapabilityMaturity =
    communicationChannels.length >= 3 ? "managed" : communicationChannels.length >= 1 ? "developing" : "absent";

  const marketingSignals = [
    asBoolean(map, "marketing.website"),
    asBoolean(map, "marketing.email_marketing"),
    asStringArray(map, "marketing.social_media").filter((s) => s !== "none").length > 0,
  ].filter(Boolean).length;
  const marketingMaturity: CapabilityMaturity =
    marketingSignals >= 3 ? "managed" : marketingSignals === 2 ? "developing" : marketingSignals === 1 ? "ad_hoc" : "absent";

  const dailyTasks = asString(map, "operations.daily_tasks");
  const taskMaturity: Record<string, CapabilityMaturity> = {
    informal: "ad_hoc",
    checklist: "developing",
    task_software: "managed",
  };

  const results: DerivedCapability[] = [
    {
      capabilityKey: "lead_management",
      currentMaturity: leadMaturity[followUp] ?? "ad_hoc",
      businessImportance: importanceFor("lead_management", "growth"),
      automationPotential,
      dependencies: DEPENDENCIES.lead_management ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "scheduling",
      currentMaturity: schedulingMaturity[scheduling] ?? "ad_hoc",
      businessImportance: importanceFor("scheduling", "operations"),
      automationPotential,
      dependencies: DEPENDENCIES.scheduling ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "customer_management",
      currentMaturity: customerMaturity,
      businessImportance: importanceFor("customer_management", "customer_experience"),
      automationPotential,
      dependencies: DEPENDENCIES.customer_management ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "finance",
      currentMaturity: financeMaturity[invoicing] ?? "ad_hoc",
      businessImportance: importanceFor("finance", "profitability"),
      automationPotential,
      dependencies: DEPENDENCIES.finance ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "operations",
      currentMaturity: operationsMaturity,
      businessImportance: importanceFor("operations", "operations"),
      automationPotential,
      dependencies: DEPENDENCIES.operations ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "reporting",
      currentMaturity: reportingMaturity,
      businessImportance: importanceFor("reporting", "profitability"),
      automationPotential,
      dependencies: DEPENDENCIES.reporting ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "communication",
      currentMaturity: communicationMaturity,
      businessImportance: importanceFor("communication", "customer_experience"),
      automationPotential,
      dependencies: DEPENDENCIES.communication ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "marketing",
      currentMaturity: marketingMaturity,
      businessImportance: importanceFor("marketing", "growth"),
      automationPotential,
      dependencies: DEPENDENCIES.marketing ?? [],
      owner: "unassigned",
    },
    {
      capabilityKey: "task_management",
      currentMaturity: taskMaturity[dailyTasks] ?? "ad_hoc",
      businessImportance: importanceFor("task_management", "staff_productivity"),
      automationPotential,
      dependencies: DEPENDENCIES.task_management ?? [],
      owner: "unassigned",
    },
  ];

  return results;
}
