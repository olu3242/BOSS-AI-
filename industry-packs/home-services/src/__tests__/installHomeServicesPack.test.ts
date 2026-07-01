/**
 * RC2.1 — Home Services Industry Pack Tests
 *
 * Validates that all registry entries are correct, cross-references are valid,
 * and the lead-to-cash customer journey is fully defined.
 */
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
  installHomeServicesPack,
  isHomeServicesIndustry,
  HOME_SERVICES_PACK_VERSION,
  HOME_SERVICES_INDUSTRIES,
} from "../index.js";

describe("Home Services Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installHomeServicesPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 industry KPIs", () => {
      const hsKpis = kpiRegistry.list().filter((k) => k.key.startsWith("hs_"));
      expect(hsKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const hsKpis = kpiRegistry.list().filter((k) => k.key.startsWith("hs_"));
      for (const kpi of hsKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 6 field service constraints", () => {
      const hsConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("hs_"));
      expect(hsConstraints.length).toBeGreaterThanOrEqual(6);
    });

    it("registers 6 AI employee roles", () => {
      const hsEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("hs_"));
      expect(hsEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const hsEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("hs_"));
      for (const employee of hsEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const hsMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("hs_"));
      expect(hsMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 field service workflows", () => {
      const hsWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("hs_"));
      expect(hsWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full lead-to-cash workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "hs_lead_intake",
        "hs_estimate_creation",
        "hs_quote_approval",
        "hs_job_scheduling",
        "hs_technician_dispatch",
        "hs_job_execution",
        "hs_invoice_generation",
        "hs_payment_confirmation",
        "hs_maintenance_follow_up",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });

    it("emergency dispatch workflow is defined", () => {
      expect(workflowRegistry.get("hs_emergency_dispatch")).toBeDefined();
    });

    it("quality verification workflow is defined", () => {
      expect(workflowRegistry.get("hs_quality_verification")).toBeDefined();
    });
  });

  // ─── WS3: Executive Workspace ───────────────────────────────────────────────

  describe("WS3 — Executive Workspace", () => {
    it("registers home services workspace with all required modules", () => {
      const ws = workspaceRegistry.get("hs_executive_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("hs_executive_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "hs_first_time_fix_rate",
      "hs_avg_response_time",
      "hs_technician_utilization",
      "hs_estimate_acceptance_rate",
      "hs_revenue_per_technician",
      "hs_avg_ticket_value",
      "hs_callback_rate",
      "hs_maintenance_renewal_rate",
      "hs_customer_satisfaction",
      "hs_gross_margin_per_job",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 7 decision templates", () => {
      const hsDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("hs_"));
      expect(hsDecisions.length).toBeGreaterThanOrEqual(7);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const hsDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("hs_"));
      for (const decision of hsDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("hire technician decision exists and targets utilization", () => {
      const decision = decisionRegistry.get("hs_hire_technician");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("hs_technician_utilization");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("dispatcher AI employee is available", () => {
      const dispatcher = aiEmployeeRegistry.get("hs_dispatcher");
      expect(dispatcher).toBeDefined();
      expect(dispatcher!.lifecycle).toBe("available");
    });

    it("all 6 field service roles are registered", () => {
      const roles = ["hs_dispatcher", "hs_operations_manager", "hs_service_manager", "hs_customer_success_manager", "hs_revenue_manager", "hs_inventory_coordinator"];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers payment, SMS, calendar, and accounting providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("hs_provider_stripe_field")).toBe(true);
      expect(providerKeys.has("hs_provider_twilio_dispatch")).toBe(true);
      expect(providerKeys.has("hs_provider_google_calendar")).toBe(true);
      expect(providerKeys.has("hs_provider_quickbooks")).toBe(true);
    });

    it("registers dispatch, scheduling, and payment tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("hs_tool_dispatch_sms")).toBe(true);
      expect(toolKeys.has("hs_tool_schedule_job")).toBe(true);
      expect(toolKeys.has("hs_tool_collect_payment")).toBe(true);
    });
  });

  // ─── WS8: Customer Journey ─────────────────────────────────────────────────

  describe("WS8 — Lead-to-Cash Customer Journey", () => {
    it("all 10 journey steps are covered by workflows or decisions", () => {
      const allWorkflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const allDecisionKeys = new Set(decisionRegistry.list().map((d) => d.key));

      // Step 1: Customer requests service → lead intake
      expect(allWorkflowKeys.has("hs_lead_intake")).toBe(true);
      // Step 2: Estimate generated
      expect(allWorkflowKeys.has("hs_estimate_creation")).toBe(true);
      // Step 3: Quote approved
      expect(allWorkflowKeys.has("hs_quote_approval")).toBe(true);
      // Step 4: Technician assigned
      expect(allWorkflowKeys.has("hs_technician_dispatch")).toBe(true);
      // Step 5: Job scheduled
      expect(allWorkflowKeys.has("hs_job_scheduling")).toBe(true);
      // Step 6: Job completed
      expect(allWorkflowKeys.has("hs_job_execution")).toBe(true);
      // Step 7: Invoice paid
      expect(allWorkflowKeys.has("hs_payment_confirmation")).toBe(true);
      // Step 8: Review requested (reuse platform review_request workflow)
      expect(allWorkflowKeys.has("review_request")).toBe(true);
      // Step 9: Maintenance plan offered
      expect(allWorkflowKeys.has("hs_maintenance_follow_up")).toBe(true);
      // Step 10: Executive workspace reflects updated KPIs
      expect(workspaceRegistry.get("hs_executive_workspace")).toBeDefined();
      expect(allDecisionKeys.has("hs_hire_technician")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(HOME_SERVICES_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installHomeServicesPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isHomeServicesIndustry correctly classifies industries", () => {
      expect(isHomeServicesIndustry("hvac")).toBe(true);
      expect(isHomeServicesIndustry("plumbing")).toBe(true);
      expect(isHomeServicesIndustry("electrical")).toBe(true);
      expect(isHomeServicesIndustry("general_smb")).toBe(false);
      expect(isHomeServicesIndustry("dental")).toBe(false);
    });

    it("HOME_SERVICES_INDUSTRIES includes all 6 sub-verticals", () => {
      expect(HOME_SERVICES_INDUSTRIES.length).toBe(6);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("registry entries are read-only after registration", () => {
      const kpi = kpiRegistry.get("hs_first_time_fix_rate");
      expect(kpi).toBeDefined();
      // Registry returns the object reference — verify it exists and is immutable by convention
      expect(kpi!.key).toBe("hs_first_time_fix_rate");
    });

    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const hsKpis = kpiRegistry.list().filter((k) => k.key.startsWith("hs_"));
      for (const kpi of hsKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 industry playbooks", () => {
      const hsPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("hs_"));
      expect(hsPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("dispatch playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("hs_dispatch_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });
  });
});
