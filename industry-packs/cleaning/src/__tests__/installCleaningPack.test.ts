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
  installCleaningPack,
  isCleaningIndustry,
  CLEANING_PACK_VERSION,
  CLEANING_INDUSTRIES,
} from "../index.js";

describe("Cleaning Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installCleaningPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 cleaning KPIs", () => {
      const cleanKpis = kpiRegistry.list().filter((k) => k.key.startsWith("clean_"));
      expect(cleanKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const cleanKpis = kpiRegistry.list().filter((k) => k.key.startsWith("clean_"));
      for (const kpi of cleanKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 cleaning constraints", () => {
      const cleanConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("clean_"));
      expect(cleanConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const cleanEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("clean_"));
      expect(cleanEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const cleanEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("clean_"));
      for (const employee of cleanEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const cleanMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("clean_"));
      expect(cleanMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 cleaning workflows", () => {
      const cleanWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("clean_"));
      expect(cleanWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full job lifecycle workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "clean_new_client_onboarding",
        "clean_quote_generation",
        "clean_job_scheduling",
        "clean_cleaner_dispatch",
        "clean_job_execution_checklist",
        "clean_quality_inspection",
        "clean_invoice_generation",
        "clean_payment_collection",
        "clean_complaint_resolution",
        "clean_recurring_schedule_management",
        "clean_supply_reorder",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Cleaning Workspace ────────────────────────────────────────────────

  describe("WS3 — Cleaning Workspace", () => {
    it("registers cleaning workspace", () => {
      const ws = workspaceRegistry.get("clean_cleaning_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("clean_cleaning_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("clean_cleaning_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "clean_revenue_per_cleaner_hour",
      "clean_job_completion_rate",
      "clean_customer_retention_rate",
      "clean_avg_job_value",
      "clean_cleaner_utilization",
      "clean_supply_cost_pct",
      "clean_labor_cost_pct",
      "clean_quality_score",
      "clean_complaint_rate",
      "clean_on_time_arrival_rate",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 cleaning decision templates", () => {
      const cleanDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("clean_"));
      expect(cleanDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const cleanDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("clean_"));
      for (const decision of cleanDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const cleanDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("clean_"));
      for (const decision of cleanDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("quality program decision targets quality_score", () => {
      const decision = decisionRegistry.get("clean_implement_quality_program");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("clean_quality_score");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 cleaning AI roles are registered", () => {
      const roles = [
        "clean_operations_manager",
        "clean_scheduling_coordinator",
        "clean_quality_inspector",
        "clean_customer_relations_manager",
        "clean_supply_coordinator",
        "clean_team_supervisor",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const cleanEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("clean_"));
      for (const employee of cleanEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers CRM, accounting, and SMS providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("clean_crm_provider")).toBe(true);
      expect(providerKeys.has("clean_accounting_provider")).toBe(true);
      expect(providerKeys.has("clean_sms_provider")).toBe(true);
    });

    it("registers scheduling, invoice, and quality checklist tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("clean_tool_schedule_job")).toBe(true);
      expect(toolKeys.has("clean_tool_generate_invoice")).toBe(true);
      expect(toolKeys.has("clean_tool_quality_checklist")).toBe(true);
    });
  });

  // ─── WS8: Job Journey ──────────────────────────────────────────────────────

  describe("WS8 — Job Journey Coverage", () => {
    it("covers full onboarding-to-payment cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Onboarding
      expect(workflowKeys.has("clean_new_client_onboarding")).toBe(true);
      // Scheduling
      expect(workflowKeys.has("clean_job_scheduling")).toBe(true);
      // Dispatch
      expect(workflowKeys.has("clean_cleaner_dispatch")).toBe(true);
      // Execution
      expect(workflowKeys.has("clean_job_execution_checklist")).toBe(true);
      // Quality
      expect(workflowKeys.has("clean_quality_inspection")).toBe(true);
      // Revenue
      expect(workflowKeys.has("clean_invoice_generation")).toBe(true);
      expect(workflowKeys.has("clean_payment_collection")).toBe(true);
      // Recurring
      expect(workflowKeys.has("clean_recurring_schedule_management")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(CLEANING_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installCleaningPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isCleaningIndustry correctly classifies industries", () => {
      expect(isCleaningIndustry("cleaning")).toBe(true);
      expect(isCleaningIndustry("janitorial")).toBe(true);
      expect(isCleaningIndustry("maid_service")).toBe(true);
      expect(isCleaningIndustry("dental")).toBe(false);
      expect(isCleaningIndustry("general_smb")).toBe(false);
    });

    it("CLEANING_INDUSTRIES includes all 7 sub-verticals", () => {
      expect(CLEANING_INDUSTRIES.length).toBe(7);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const cleanKpis = kpiRegistry.list().filter((k) => k.key.startsWith("clean_"));
      for (const kpi of cleanKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 cleaning playbooks", () => {
      const cleanPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("clean_"));
      expect(cleanPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("quality recovery playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("clean_quality_recovery_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("retention playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("clean_retention_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("clean_launch_referral_program");
    });
  });
});
