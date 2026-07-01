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
  installAccountingPack,
  isAccountingIndustry,
  ACCOUNTING_PACK_VERSION,
  ACCOUNTING_INDUSTRIES,
} from "../index.js";

describe("Accounting Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installAccountingPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 accounting KPIs", () => {
      const acctKpis = kpiRegistry.list().filter((k) => k.key.startsWith("acct_"));
      expect(acctKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const acctKpis = kpiRegistry.list().filter((k) => k.key.startsWith("acct_"));
      for (const kpi of acctKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers accounting constraints", () => {
      const acctConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("acct_"));
      expect(acctConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const acctEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("acct_"));
      expect(acctEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const acctEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("acct_"));
      for (const employee of acctEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const acctMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("acct_"));
      expect(acctMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 accounting workflows", () => {
      const acctWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("acct_"));
      expect(acctWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full engagement lifecycle workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "acct_client_onboarding",
        "acct_engagement_scoping",
        "acct_monthly_bookkeeping",
        "acct_payroll_processing",
        "acct_tax_return_preparation",
        "acct_invoice_generation",
        "acct_payment_collection",
        "acct_client_status_meeting",
        "acct_deadline_tracking",
        "acct_referral_management",
        "acct_billing_review",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Firm Workspace ───────────────────────────────────────────────────

  describe("WS3 — Firm Workspace", () => {
    it("registers accounting firm workspace", () => {
      const ws = workspaceRegistry.get("acct_accounting_firm_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("acct_accounting_firm_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is a valid KPI", () => {
      const ws = workspaceRegistry.get("acct_accounting_firm_workspace");
      const kpi = kpiRegistry.get(ws!.primaryMetricKey);
      expect(kpi).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "acct_billable_hours_pct",
      "acct_realization_rate",
      "acct_revenue_per_staff",
      "acct_client_retention_rate",
      "acct_avg_engagement_value",
      "acct_accounts_receivable_days",
      "acct_new_clients_per_quarter",
      "acct_write_off_rate",
      "acct_on_time_delivery_rate",
      "acct_referral_conversion_rate",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 accounting decision templates", () => {
      const acctDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("acct_"));
      expect(acctDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const acctDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("acct_"));
      for (const decision of acctDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const acctDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("acct_"));
      for (const decision of acctDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("AR collection decision targets accounts receivable days", () => {
      const decision = decisionRegistry.get("acct_improve_ar_collection");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("acct_accounts_receivable_days");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 accounting AI roles are registered", () => {
      const roles = [
        "acct_managing_partner",
        "acct_billing_manager",
        "acct_client_manager",
        "acct_business_developer",
        "acct_operations_manager",
        "acct_compliance_coordinator",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const acctEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("acct_"));
      for (const employee of acctEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers accounting software, CRM, and email providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("acct_accounting_software")).toBe(true);
      expect(providerKeys.has("acct_crm_provider")).toBe(true);
      expect(providerKeys.has("acct_email_provider")).toBe(true);
    });

    it("registers invoice, deadline alert, and report tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("acct_tool_send_invoice")).toBe(true);
      expect(toolKeys.has("acct_tool_deadline_alert")).toBe(true);
      expect(toolKeys.has("acct_tool_generate_report")).toBe(true);
    });
  });

  // ─── WS8: Engagement Journey ───────────────────────────────────────────────

  describe("WS8 — Engagement Journey Coverage", () => {
    it("covers full onboarding-to-billing cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Onboarding
      expect(workflowKeys.has("acct_client_onboarding")).toBe(true);
      // Delivery
      expect(workflowKeys.has("acct_monthly_bookkeeping")).toBe(true);
      expect(workflowKeys.has("acct_tax_return_preparation")).toBe(true);
      expect(workflowKeys.has("acct_deadline_tracking")).toBe(true);
      // Billing
      expect(workflowKeys.has("acct_invoice_generation")).toBe(true);
      expect(workflowKeys.has("acct_payment_collection")).toBe(true);
      // Retention
      expect(workflowKeys.has("acct_client_status_meeting")).toBe(true);
      // Growth
      expect(workflowKeys.has("acct_referral_management")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(ACCOUNTING_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installAccountingPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isAccountingIndustry correctly classifies industries", () => {
      expect(isAccountingIndustry("accounting")).toBe(true);
      expect(isAccountingIndustry("bookkeeping")).toBe(true);
      expect(isAccountingIndustry("cpa")).toBe(true);
      expect(isAccountingIndustry("hvac")).toBe(false);
      expect(isAccountingIndustry("dental")).toBe(false);
    });

    it("ACCOUNTING_INDUSTRIES includes all sub-verticals", () => {
      expect(ACCOUNTING_INDUSTRIES.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const acctKpis = kpiRegistry.list().filter((k) => k.key.startsWith("acct_"));
      for (const kpi of acctKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 accounting playbooks", () => {
      const acctPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("acct_"));
      expect(acctPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("AR collection playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("acct_ar_collection_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(3);
    });

    it("referral playbook references valid decisions", () => {
      const playbook = playbookRegistry.get("acct_referral_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("acct_build_referral_network");
    });
  });
});
