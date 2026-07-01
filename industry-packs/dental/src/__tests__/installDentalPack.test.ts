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
  installDentalPack,
  isDentalIndustry,
  DENTAL_PACK_VERSION,
  DENTAL_INDUSTRIES,
} from "../index.js";

describe("Dental Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installDentalPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 dental KPIs", () => {
      const dentalKpis = kpiRegistry.list().filter((k) => k.key.startsWith("dental_"));
      expect(dentalKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const dentalKpis = kpiRegistry.list().filter((k) => k.key.startsWith("dental_"));
      for (const kpi of dentalKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 6 dental constraints", () => {
      const dentalConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("dental_"));
      expect(dentalConstraints.length).toBeGreaterThanOrEqual(6);
    });

    it("registers 6 AI employee roles", () => {
      const dentalEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("dental_"));
      expect(dentalEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const dentalEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("dental_"));
      for (const employee of dentalEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const dentalMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("dental_"));
      expect(dentalMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 dental workflows", () => {
      const dentalWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("dental_"));
      expect(dentalWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full patient journey workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "dental_new_patient_intake",
        "dental_appointment_scheduling",
        "dental_confirmation_reminders",
        "dental_patient_check_in",
        "dental_treatment_plan_presentation",
        "dental_insurance_verification",
        "dental_billing",
        "dental_payment_collection",
        "dental_recall_scheduling",
        "dental_review_request",
        "dental_reactivation_campaign",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Practice Workspace ────────────────────────────────────────────────

  describe("WS3 — Practice Workspace", () => {
    it("registers dental practice workspace", () => {
      const ws = workspaceRegistry.get("dental_practice_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("dental_practice_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("dental_practice_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "dental_chair_utilization",
      "dental_provider_production",
      "dental_collections_ratio",
      "dental_case_acceptance",
      "dental_recall_completion",
      "dental_hygiene_reappointment",
      "dental_no_show_rate",
      "dental_cancellation_rate",
      "dental_avg_production_per_visit",
      "dental_new_patient_growth",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 dental decision templates", () => {
      const dentalDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("dental_"));
      expect(dentalDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const dentalDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("dental_"));
      for (const decision of dentalDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const dentalDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("dental_"));
      for (const decision of dentalDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("improve collections decision targets collections_ratio", () => {
      const decision = decisionRegistry.get("dental_improve_collections");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("dental_collections_ratio");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 dental AI roles are registered", () => {
      const roles = [
        "dental_practice_manager",
        "dental_treatment_coordinator",
        "dental_front_desk_coordinator",
        "dental_recall_coordinator",
        "dental_revenue_coordinator",
        "dental_patient_success_coordinator",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const dentalEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("dental_"));
      for (const employee of dentalEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers PMS, digital forms, and insurance providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("dental_provider_pms")).toBe(true);
      expect(providerKeys.has("dental_provider_digital_forms")).toBe(true);
      expect(providerKeys.has("dental_provider_insurance_portal")).toBe(true);
    });

    it("registers insurance, recall, and scheduling tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("dental_tool_verify_insurance")).toBe(true);
      expect(toolKeys.has("dental_tool_send_recall")).toBe(true);
      expect(toolKeys.has("dental_tool_schedule_appointment")).toBe(true);
    });
  });

  // ─── WS8: Patient Journey ──────────────────────────────────────────────────

  describe("WS8 — Patient Journey Coverage", () => {
    it("covers full intake-to-recall cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Intake
      expect(workflowKeys.has("dental_new_patient_intake")).toBe(true);
      // Scheduling
      expect(workflowKeys.has("dental_appointment_scheduling")).toBe(true);
      // Treatment
      expect(workflowKeys.has("dental_treatment_plan_presentation")).toBe(true);
      // Revenue
      expect(workflowKeys.has("dental_insurance_verification")).toBe(true);
      expect(workflowKeys.has("dental_billing")).toBe(true);
      expect(workflowKeys.has("dental_payment_collection")).toBe(true);
      // Recall
      expect(workflowKeys.has("dental_recall_scheduling")).toBe(true);
      // Reactivation
      expect(workflowKeys.has("dental_reactivation_campaign")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(DENTAL_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installDentalPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isDentalIndustry correctly classifies industries", () => {
      expect(isDentalIndustry("dental")).toBe(true);
      expect(isDentalIndustry("dentistry")).toBe(true);
      expect(isDentalIndustry("orthodontics")).toBe(true);
      expect(isDentalIndustry("hvac")).toBe(false);
      expect(isDentalIndustry("general_smb")).toBe(false);
    });

    it("DENTAL_INDUSTRIES includes all 6 sub-verticals", () => {
      expect(DENTAL_INDUSTRIES.length).toBe(6);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const dentalKpis = kpiRegistry.list().filter((k) => k.key.startsWith("dental_"));
      for (const kpi of dentalKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 dental playbooks", () => {
      const dentalPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("dental_"));
      expect(dentalPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("recall playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("dental_recall_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("collections playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("dental_collections_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("dental_improve_collections");
    });
  });
});
