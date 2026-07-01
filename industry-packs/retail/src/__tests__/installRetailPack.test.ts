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
  installRetailPack,
  isRetailIndustry,
  RETAIL_PACK_VERSION,
  RETAIL_INDUSTRIES,
} from "../index.js";

describe("Retail Industry Pack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
    installRetailPack();
  });

  // ─── WS1: Registry ─────────────────────────────────────────────────────────

  describe("WS1 — Industry Registry", () => {
    it("registers 10 retail KPIs", () => {
      const retailKpis = kpiRegistry.list().filter((k) => k.key.startsWith("retail_"));
      expect(retailKpis.length).toBeGreaterThanOrEqual(10);
    });

    it("all KPIs have required fields", () => {
      const retailKpis = kpiRegistry.list().filter((k) => k.key.startsWith("retail_"));
      for (const kpi of retailKpis) {
        expect(kpi.label).toBeTruthy();
        expect(kpi.description).toBeTruthy();
        expect(kpi.owner).toBeTruthy();
        expect(kpi.measurementFrequency).toBeTruthy();
        expect(kpi.targetRange).toBeTruthy();
      }
    });

    it("registers 7 retail constraints", () => {
      const retailConstraints = constraintRegistry.list().filter((c) => c.key.startsWith("retail_"));
      expect(retailConstraints.length).toBeGreaterThanOrEqual(7);
    });

    it("registers 6 AI employee roles", () => {
      const retailEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("retail_"));
      expect(retailEmployees.length).toBeGreaterThanOrEqual(6);
    });

    it("all AI employees reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const retailEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("retail_"));
      for (const employee of retailEmployees) {
        for (const kpiKey of employee.kpis) {
          expect(kpiKeys.has(kpiKey), `AI employee ${employee.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("registers 5 industry MRI questions", () => {
      const retailMri = mriQuestionRegistry.list().filter((q) => q.key.startsWith("retail_"));
      expect(retailMri.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ─── WS2: Workflows ────────────────────────────────────────────────────────

  describe("WS2 — Industry Workflows", () => {
    it("registers 11 retail workflows", () => {
      const retailWorkflows = workflowRegistry.list().filter((w) => w.key.startsWith("retail_"));
      expect(retailWorkflows.length).toBeGreaterThanOrEqual(11);
    });

    it("full retail operations workflow chain is defined", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      const requiredWorkflows = [
        "retail_purchase_order_management",
        "retail_receiving_and_putaway",
        "retail_inventory_count",
        "retail_floor_merchandising",
        "retail_customer_checkout",
        "retail_returns_processing",
        "retail_markdown_management",
        "retail_loyalty_enrollment",
        "retail_promotional_campaign",
        "retail_daily_sales_reconciliation",
        "retail_vendor_performance_review",
      ];
      for (const key of requiredWorkflows) {
        expect(workflowKeys.has(key), `Missing workflow: ${key}`).toBe(true);
      }
    });
  });

  // ─── WS3: Retail Workspace ─────────────────────────────────────────────────

  describe("WS3 — Retail Store Workspace", () => {
    it("registers retail store workspace", () => {
      const ws = workspaceRegistry.get("retail_store_workspace");
      expect(ws).toBeDefined();
      expect(ws!.layout).toBe("operational");
    });

    it("workspace has all required modules", () => {
      const ws = workspaceRegistry.get("retail_store_workspace");
      const moduleKeys = ws!.modules.map((m) => m.moduleKey);
      expect(moduleKeys).toContain("kpi_strip");
      expect(moduleKeys).toContain("decisions_panel");
      expect(moduleKeys).toContain("approval_queue");
      expect(moduleKeys).toContain("health_summary");
    });

    it("workspace primary metric is gross margin", () => {
      const ws = workspaceRegistry.get("retail_store_workspace");
      expect(ws!.primaryMetricKey).toBe("retail_gross_margin_pct");
      expect(kpiRegistry.get(ws!.primaryMetricKey)).toBeDefined();
    });
  });

  // ─── WS4: KPIs ─────────────────────────────────────────────────────────────

  describe("WS4 — Industry KPIs", () => {
    const expectedKpis = [
      "retail_gross_margin_pct",
      "retail_inventory_turnover",
      "retail_sell_through_rate",
      "retail_avg_transaction_value",
      "retail_units_per_transaction",
      "retail_conversion_rate",
      "retail_sales_per_sqft",
      "retail_shrinkage_rate",
      "retail_customer_return_rate",
      "retail_stockout_rate",
    ];

    for (const kpiKey of expectedKpis) {
      it(`registers KPI: ${kpiKey}`, () => {
        expect(kpiRegistry.get(kpiKey)).toBeDefined();
      });
    }
  });

  // ─── WS5: Decision OS ──────────────────────────────────────────────────────

  describe("WS5 — Decision OS Extensions", () => {
    it("registers 8 retail decision templates", () => {
      const retailDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("retail_"));
      expect(retailDecisions.length).toBeGreaterThanOrEqual(8);
    });

    it("all decisions reference valid KPIs", () => {
      const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
      const retailDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("retail_"));
      for (const decision of retailDecisions) {
        for (const kpiKey of decision.relatedKpiKeys) {
          expect(kpiKeys.has(kpiKey), `Decision ${decision.key} references unknown KPI: ${kpiKey}`).toBe(true);
        }
      }
    });

    it("all decisions reference valid constraints", () => {
      const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
      const retailDecisions = decisionRegistry.list().filter((d) => d.key.startsWith("retail_"));
      for (const decision of retailDecisions) {
        for (const constraintKey of decision.relatedConstraintDefinitionKeys) {
          expect(
            constraintKeys.has(constraintKey),
            `Decision ${decision.key} references unknown constraint: ${constraintKey}`,
          ).toBe(true);
        }
      }
    });

    it("clear slow-moving inventory decision targets sell-through", () => {
      const decision = decisionRegistry.get("retail_clear_slow_moving_inventory");
      expect(decision).toBeDefined();
      expect(decision!.relatedKpiKeys).toContain("retail_sell_through_rate");
    });
  });

  // ─── WS6: AI Workforce ─────────────────────────────────────────────────────

  describe("WS6 — AI Workforce Extensions", () => {
    it("all 6 retail AI roles are registered", () => {
      const roles = [
        "retail_store_manager",
        "retail_inventory_manager",
        "retail_sales_floor_lead",
        "retail_loss_prevention_coordinator",
        "retail_customer_experience_manager",
        "retail_merchandising_coordinator",
      ];
      for (const role of roles) {
        expect(aiEmployeeRegistry.get(role), `Missing AI role: ${role}`).toBeDefined();
      }
    });

    it("all roles are available lifecycle", () => {
      const retailEmployees = aiEmployeeRegistry.list().filter((e) => e.key.startsWith("retail_"));
      for (const employee of retailEmployees) {
        expect(employee.lifecycle).toBe("available");
      }
    });
  });

  // ─── WS7: Integrations ─────────────────────────────────────────────────────

  describe("WS7 — Integrations", () => {
    it("registers POS, inventory, and CRM providers", () => {
      const providerKeys = new Set(providerDefinitionRegistry.list().map((p) => p.key));
      expect(providerKeys.has("retail_provider_pos")).toBe(true);
      expect(providerKeys.has("retail_provider_inventory")).toBe(true);
      expect(providerKeys.has("retail_provider_crm")).toBe(true);
    });

    it("registers purchase order, markdown, and loyalty tools", () => {
      const toolKeys = new Set(toolDefinitionRegistry.list().map((t) => t.key));
      expect(toolKeys.has("retail_tool_create_purchase_order")).toBe(true);
      expect(toolKeys.has("retail_tool_apply_markdown")).toBe(true);
      expect(toolKeys.has("retail_tool_send_loyalty_offer")).toBe(true);
    });
  });

  // ─── WS8: Retail Operations Coverage ───────────────────────────────────────

  describe("WS8 — Full Retail Operations Coverage", () => {
    it("covers full buy-sell-replenish cycle", () => {
      const workflowKeys = new Set(workflowRegistry.list().map((w) => w.key));
      // Buy
      expect(workflowKeys.has("retail_purchase_order_management")).toBe(true);
      expect(workflowKeys.has("retail_receiving_and_putaway")).toBe(true);
      // Sell
      expect(workflowKeys.has("retail_floor_merchandising")).toBe(true);
      expect(workflowKeys.has("retail_customer_checkout")).toBe(true);
      // Clear
      expect(workflowKeys.has("retail_markdown_management")).toBe(true);
      // Control
      expect(workflowKeys.has("retail_inventory_count")).toBe(true);
      // Retain
      expect(workflowKeys.has("retail_loyalty_enrollment")).toBe(true);
    });
  });

  // ─── Pack Metadata ──────────────────────────────────────────────────────────

  describe("Pack Metadata", () => {
    it("exposes version", () => {
      expect(RETAIL_PACK_VERSION).toBeTruthy();
    });

    it("idempotent — installing twice has no effect", () => {
      const kpisBefore = kpiRegistry.list().length;
      installRetailPack();
      expect(kpiRegistry.list().length).toBe(kpisBefore);
    });

    it("isRetailIndustry correctly classifies industries", () => {
      expect(isRetailIndustry("retail")).toBe(true);
      expect(isRetailIndustry("specialty_retail")).toBe(true);
      expect(isRetailIndustry("fashion_retail")).toBe(true);
      expect(isRetailIndustry("hvac")).toBe(false);
      expect(isRetailIndustry("dental")).toBe(false);
      expect(isRetailIndustry("restaurant")).toBe(false);
    });

    it("RETAIL_INDUSTRIES includes all 7 sub-verticals", () => {
      expect(RETAIL_INDUSTRIES.length).toBe(7);
    });
  });

  // ─── Multi-tenant Isolation ─────────────────────────────────────────────────

  describe("Multi-tenant Isolation", () => {
    it("pack does not add org_id — all entries are org-agnostic by design", () => {
      const retailKpis = kpiRegistry.list().filter((k) => k.key.startsWith("retail_"));
      for (const kpi of retailKpis) {
        expect("orgId" in kpi).toBe(false);
      }
    });
  });

  // ─── Playbooks ──────────────────────────────────────────────────────────────

  describe("Playbooks", () => {
    it("registers 4 retail playbooks", () => {
      const retailPlaybooks = playbookRegistry.list().filter((p) => p.key.startsWith("retail_"));
      expect(retailPlaybooks.length).toBeGreaterThanOrEqual(4);
    });

    it("inventory clearance playbook has multiple steps", () => {
      const playbook = playbookRegistry.get("retail_inventory_clearance_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.steps.length).toBeGreaterThanOrEqual(4);
    });

    it("shrinkage reduction playbook targets loss prevention decision", () => {
      const playbook = playbookRegistry.get("retail_shrinkage_reduction_playbook");
      expect(playbook).toBeDefined();
      expect(playbook!.relatedDecisionKeys).toContain("retail_reduce_shrinkage");
    });
  });
});
