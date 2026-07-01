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
  installLandscapingPack,
  isLandscapingIndustry,
  LANDSCAPING_PACK_VERSION,
  LANDSCAPING_INDUSTRIES,
} from "../index.js";

describe("Landscaping Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installLandscapingPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 landscaping KPIs", () => {
      const lscapeKpis = kpiRegistry.list().filter((k) => k.key.startsWith("lscape_"));
      expect(lscapeKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const lscapeKpis = kpiRegistry.list().filter((k) => k.key.startsWith("lscape_"));
      for (const kpi of lscapeKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 landscaping constraints", () => {
      const lscapeConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("lscape_"));
      expect(lscapeConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const lscapeEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("lscape_"));
      expect(lscapeEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const lscapeEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("lscape_"));
      for (const employee of lscapeEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const lscapeMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("lscape_"));
      expect(lscapeMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 landscaping workflows", () => {
      const lscapeWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("lscape_"));
      expect(lscapeWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full job lifecycle workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "lscape_estimate_request",
        "lscape_estimate_creation",
        "lscape_job_scheduling",
        "lscape_crew_dispatch",
        "lscape_job_execution",
        "lscape_job_completion_signoff",
        "lscape_invoice_generation",
        "lscape_payment_collection",
        "lscape_weekly_crew_review",
        "lscape_equipment_maintenance",
        "lscape_seasonal_planning",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Landscaping Workspace ─────────────────────────────────────────────

  describe("WS3 — Landscaping Workspace", () => {
    it("registers landscaping workspace", () => {
      const ws = workspaceRegistry.get("lscape_landscaping_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("lscape_landscaping_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("lscape_landscaping_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "lscape_revenue_per_crew_hour",
      "lscape_job_completion_rate",
      "lscape_customer_retention_rate",
      "lscape_avg_job_value",
      "lscape_equipment_utilization",
      "lscape_material_cost_pct",
      "lscape_labor_cost_pct",
      "lscape_estimate_conversion_rate",
      "lscape_seasonal_revenue_index",
      "lscape_online_review_rating",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 landscaping decision templates", () => {
      const lscapeDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("lscape_"));
      expect(lscapeDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const lscapeDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("lscape_"));
      for (const decision of lscapeDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const lscapeDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("lscape_"));
      for (const decision of lscapeDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("equipment purchase decision targets equipment utilization", () => {
      const decision = decisionRegistry.get("lscape_equipment_purchase");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("lscape_equipment_utilization");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 landscaping AI roles are registered", () => {
      const roles = [
        "lscape_operations_manager",
        "lscape_estimator",
        "lscape_crew_dispatcher",
        "lscape_customer_relations_manager",
        "lscape_equipment_coordinator",
        "lscape_seasonal_planner",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const lscapeEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("lscape_"));
      for (const employee of lscapeEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers CRM, accounting, and SMS providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("lscape_crm_provider")).toBe(true);
      expect(providerKeys.has("lscape_accounting_provider")).toBe(true);
      expect(providerKeys.has("lscape_sms_provider")).toBe(true);
    });

    it("registers job scheduling, invoice, and notification tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("lscape_tool_schedule_job")).toBe(true);
      expect(toolKeys.has("lscape_tool_generate_invoice")).toBe(true);
      expect(toolKeys.has("lscape_tool_notify_customer")).toBe(true);
    });
  });

  // ─── WS8: Job Journey Coverage ─────────────────────────────────────────────

  describe("WS8 — Job Journey Coverage", () => {
    it("covers full estimate-to-payment cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Estimate
      expect(workflowKeys.has("lscape_estimate_request")).toBe(true);
      expect(workflowKeys.has("lscape_estimate_creation")).toBe(true);
      // Scheduling
      expect(workflowKeys.has("lscape_job_scheduling")).toBe(true);
      expect(workflowKeys.has("lscape_crew_dispatch")).toBe(true);
      // Execution
      expect(workflowKeys.has("lscape_job_execution")).toBe(true);
      expect(workflowKeys.has("lscape_job_completion_signoff")).toBe(true);
      // Revenue
      expect(workflowKeys.has("lscape_invoice_generation")).toBe(true);
      expect(workflowKeys.has("lscape_payment_collection")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(LANDSCAPING_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installLandscapingPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isLandscapingIndustry correctly classifies industries", () => {
      expect(isLandscapingIndustry("landscaping")).toBe(true);
      expect(isLandscapingIndustry("lawn_care")).toBe(true);
      expect(isLandscapingIndustry("tree_service")).toBe(true);
      expect(isLandscapingIndustry("dental")).toBe(false);
      expect(isLandscapingIndustry("general_smb")).toBe(false);
    });

    it("LANDSCAPING_INDUSTRIES includes all 6 sub-verticals", () => {
      expect(LANDSCAPING_INDUSTRIES.length).toBe(6);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const lscapeKpis = kpiRegistry.list().filter((k) => k.key.startsWith("lscape_"));
      for (const kpi of lscapeKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 landscaping playbooks", () => {
      const lscapePlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("lscape_"));
      expect(lscapePlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("slow season playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("lscape_slow_season_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("customer retention playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("lscape_customer_retention_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("lscape_launch_referral_program");
    });
  });
});
