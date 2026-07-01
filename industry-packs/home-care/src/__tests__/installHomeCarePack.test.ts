import { beforeAll, describe, expect, it } from "vitest";
import {
  kpiRegistry,
  workflowRegistry,
  decisionRegistry,
  aiEmployeeRegistry,
  constraintRegistry,
  playbookRegistry,
  mriQuestionRegistry,
  providerDefinitionRegistry,
  toolDefinitionRegistry,
  workspaceRegistry,
} from "@boss/registries";
import { installGeneralSmbPack } from "@boss/industry-pack-general-smb";
import {
  installHomeCarePack,
  isHomeCareIndustry,
  HOME_CARE_PACK_VERSION,
  HOME_CARE_INDUSTRIES,
} from "../index.js";

describe("Home Care Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installHomeCarePack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 home care KPIs", () => {
      const hcareKpis = kpiRegistry.list().filter((k) => k.key.startsWith("hcare_"));
      expect(hcareKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const hcareKpis = kpiRegistry.list().filter((k) => k.key.startsWith("hcare_"));
      for (const kpi of hcareKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 home care constraints", () => {
      const hcareConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("hcare_"));
      expect(hcareConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const hcareEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("hcare_"));
      expect(hcareEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const hcareEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("hcare_"));
      for (const employee of hcareEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const hcareMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("hcare_"));
      expect(hcareMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 home care workflows", () => {
      const hcareWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("hcare_"));
      expect(hcareWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full care delivery workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "hcare_client_intake",
        "hcare_care_plan_creation",
        "hcare_caregiver_matching",
        "hcare_visit_scheduling",
        "hcare_caregiver_check_in",
        "hcare_visit_documentation",
        "hcare_invoice_generation",
        "hcare_family_communication",
        "hcare_caregiver_performance_review",
        "hcare_incident_reporting",
        "hcare_care_plan_reassessment",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Home Care Workspace ───────────────────────────────────────────────

  describe("WS3 — Home Care Workspace", () => {
    it("registers home care workspace", () => {
      const ws = workspaceRegistry.get("hcare_home_care_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("hcare_home_care_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("hcare_home_care_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "hcare_caregiver_utilization",
      "hcare_client_retention_rate",
      "hcare_avg_weekly_hours_per_client",
      "hcare_caregiver_turnover_rate",
      "hcare_revenue_per_caregiver_hour",
      "hcare_client_satisfaction_score",
      "hcare_missed_visit_rate",
      "hcare_referral_conversion_rate",
      "hcare_billable_hours_pct",
      "hcare_caregiver_match_score",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 home care decision templates", () => {
      const hcareDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("hcare_"));
      expect(hcareDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const hcareDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("hcare_"));
      for (const decision of hcareDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const hcareDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("hcare_"));
      for (const decision of hcareDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("hire caregivers decision targets caregiver utilization", () => {
      const decision = decisionRegistry.get("hcare_hire_caregivers");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("hcare_caregiver_utilization");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 home care AI roles are registered", () => {
      const roles = [
        "hcare_care_coordinator",
        "hcare_caregiver_manager",
        "hcare_client_relations_manager",
        "hcare_scheduling_coordinator",
        "hcare_billing_coordinator",
        "hcare_quality_assurance_manager",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const hcareEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("hcare_"));
      for (const employee of hcareEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers calendar, accounting, and SMS providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("hcare_calendar_provider")).toBe(true);
      expect(providerKeys.has("hcare_accounting_provider")).toBe(true);
      expect(providerKeys.has("hcare_sms_provider")).toBe(true);
    });

    it("registers scheduling, documentation, and billing tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("hcare_tool_schedule_visit")).toBe(true);
      expect(toolKeys.has("hcare_tool_log_visit_notes")).toBe(true);
      expect(toolKeys.has("hcare_tool_generate_invoice")).toBe(true);
    });
  });

  // ─── WS8: Care Delivery Journey ────────────────────────────────────────────

  describe("WS8 — Care Delivery Journey Coverage", () => {
    it("covers full intake-to-invoice cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Intake
      expect(workflowKeys.has("hcare_client_intake")).toBe(true);
      // Care planning
      expect(workflowKeys.has("hcare_care_plan_creation")).toBe(true);
      // Matching
      expect(workflowKeys.has("hcare_caregiver_matching")).toBe(true);
      // Scheduling
      expect(workflowKeys.has("hcare_visit_scheduling")).toBe(true);
      // Execution
      expect(workflowKeys.has("hcare_caregiver_check_in")).toBe(true);
      expect(workflowKeys.has("hcare_visit_documentation")).toBe(true);
      // Billing
      expect(workflowKeys.has("hcare_invoice_generation")).toBe(true);
      // Reassessment
      expect(workflowKeys.has("hcare_care_plan_reassessment")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(HOME_CARE_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installHomeCarePack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isHomeCareIndustry correctly classifies industries", () => {
      expect(isHomeCareIndustry("home_care")).toBe(true);
      expect(isHomeCareIndustry("senior_care")).toBe(true);
      expect(isHomeCareIndustry("companion_care")).toBe(true);
      expect(isHomeCareIndustry("dental")).toBe(false);
      expect(isHomeCareIndustry("general_smb")).toBe(false);
    });

    it("HOME_CARE_INDUSTRIES includes all 6 sub-verticals", () => {
      expect(HOME_CARE_INDUSTRIES.length).toBe(6);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const hcareKpis = kpiRegistry.list().filter((k) => k.key.startsWith("hcare_"));
      for (const kpi of hcareKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 home care playbooks", () => {
      const hcarePlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("hcare_"));
      expect(hcarePlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("caregiver retention playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("hcare_caregiver_retention_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("client retention playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("hcare_client_retention_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("hcare_launch_family_portal");
    });
  });
});
