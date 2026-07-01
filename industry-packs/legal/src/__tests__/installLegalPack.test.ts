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
  installLegalPack,
  isLegalIndustry,
  LEGAL_PACK_VERSION,
  LEGAL_INDUSTRIES,
} from "../index.js";

describe("Legal Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installLegalPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 legal KPIs", () => {
      const legalKpis = kpiRegistry.list().filter((k) => k.key.startsWith("legal_"));
      expect(legalKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const legalKpis = kpiRegistry.list().filter((k) => k.key.startsWith("legal_"));
      for (const kpi of legalKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 legal constraints", () => {
      const legalConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("legal_"));
      expect(legalConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const legalEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("legal_"));
      expect(legalEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const legalEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("legal_"));
      for (const employee of legalEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const legalMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("legal_"));
      expect(legalMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 legal workflows", () => {
      const legalWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("legal_"));
      expect(legalWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full matter lifecycle workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "legal_client_intake",
        "legal_matter_opening",
        "legal_time_entry",
        "legal_invoice_generation",
        "legal_payment_collection",
        "legal_matter_update",
        "legal_deadline_management",
        "legal_matter_close",
        "legal_referral_tracking",
        "legal_business_development",
        "legal_billing_review",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Firm Workspace ───────────────────────────────────────────────────

  describe("WS3 — Firm Workspace", () => {
    it("registers law firm workspace", () => {
      const ws = workspaceRegistry.get("legal_law_firm_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("legal_law_firm_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("legal_law_firm_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "legal_billable_hours_pct",
      "legal_realization_rate",
      "legal_avg_hourly_rate",
      "legal_matter_cycle_time",
      "legal_client_acquisition_cost",
      "legal_client_retention_rate",
      "legal_accounts_receivable_days",
      "legal_new_matters_per_month",
      "legal_write_off_rate",
      "legal_referral_conversion_rate",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 legal decision templates", () => {
      const legalDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("legal_"));
      expect(legalDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const legalDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("legal_"));
      for (const decision of legalDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const legalDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("legal_"));
      for (const decision of legalDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("AR collection decision targets accounts receivable days", () => {
      const decision = decisionRegistry.get("legal_improve_ar_collection");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("legal_accounts_receivable_days");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 legal AI roles are registered", () => {
      const roles = [
        "legal_managing_partner",
        "legal_billing_manager",
        "legal_client_relations_manager",
        "legal_business_developer",
        "legal_operations_manager",
        "legal_intake_coordinator",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const legalEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("legal_"));
      for (const employee of legalEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers billing, CRM, and email providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("legal_billing_accounting")).toBe(true);
      expect(providerKeys.has("legal_crm_provider")).toBe(true);
      expect(providerKeys.has("legal_email_provider")).toBe(true);
    });

    it("registers invoice, conflict check, and communication tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("legal_tool_send_invoice")).toBe(true);
      expect(toolKeys.has("legal_tool_conflict_check")).toBe(true);
      expect(toolKeys.has("legal_tool_send_status_update")).toBe(true);
    });
  });

  // ─── WS8: Matter Journey ───────────────────────────────────────────────────

  describe("WS8 — Matter Journey Coverage", () => {
    it("covers full intake-to-close cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Intake
      expect(workflowKeys.has("legal_client_intake")).toBe(true);
      // Matter management
      expect(workflowKeys.has("legal_matter_opening")).toBe(true);
      expect(workflowKeys.has("legal_time_entry")).toBe(true);
      expect(workflowKeys.has("legal_deadline_management")).toBe(true);
      // Billing
      expect(workflowKeys.has("legal_invoice_generation")).toBe(true);
      expect(workflowKeys.has("legal_payment_collection")).toBe(true);
      // Close
      expect(workflowKeys.has("legal_matter_close")).toBe(true);
      // Business development
      expect(workflowKeys.has("legal_referral_tracking")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(LEGAL_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installLegalPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isLegalIndustry correctly classifies industries", () => {
      expect(isLegalIndustry("legal")).toBe(true);
      expect(isLegalIndustry("law_firm")).toBe(true);
      expect(isLegalIndustry("family_law")).toBe(true);
      expect(isLegalIndustry("hvac")).toBe(false);
      expect(isLegalIndustry("dental")).toBe(false);
    });

    it("LEGAL_INDUSTRIES includes all sub-verticals", () => {
      expect(LEGAL_INDUSTRIES.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const legalKpis = kpiRegistry.list().filter((k) => k.key.startsWith("legal_"));
      for (const kpi of legalKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 legal playbooks", () => {
      const legalPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("legal_"));
      expect(legalPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("AR collection playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("legal_ar_collection_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("referral network playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("legal_referral_network_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("legal_build_referral_network");
    });
  });
});
