import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createWorkflowService } from "../services/workflowService.js";
import { createWorkflowRunService } from "../services/workflowRunService.js";
import { createLifecyclePolicyService } from "../services/lifecyclePolicyService.js";
import { createPolicyEngineService, type PolicyDecision } from "../services/policyEngineService.js";

const ORG = "org-w1a";
const BIZ = "biz-w1a";

function first<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error("Expected at least one element");
  return arr[0] as T;
}

describe("Wave 1A — Workflow + LifecyclePolicy + PolicyEngine", () => {
  let repos: ReturnType<typeof createInMemoryContainer>;
  let workflowSvc: ReturnType<typeof createWorkflowService>;
  let workflowRunSvc: ReturnType<typeof createWorkflowRunService>;
  let policySvc: ReturnType<typeof createLifecyclePolicyService>;
  let engine: ReturnType<typeof createPolicyEngineService>;

  beforeEach(() => {
    repos = createInMemoryContainer();
    workflowSvc = createWorkflowService(repos.workflows);
    workflowRunSvc = createWorkflowRunService(repos.workflowRuns);
    policySvc = createLifecyclePolicyService(repos.lifecyclePolicies);
    engine = createPolicyEngineService(repos.lifecyclePolicies, repos.workflows, repos.workflowRuns, repos.eventBus);
  });

  describe("WorkflowService", () => {
    it("creates a draft workflow", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, {
        name: "Onboard Customer",
        triggerEvent: "lead.converted",
      });
      expect(wf.id).toBeTruthy();
      expect(wf.status).toBe("draft");
      expect(wf.version).toBe(1);
      expect(wf.orgId).toBe(ORG);
    });

    it("publishes a draft workflow", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "lead.converted" });
      const published = await workflowSvc.publish(ORG, wf.id);
      expect(published.status).toBe("published");
    });

    it("archives a published workflow", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "lead.converted" });
      await workflowSvc.publish(ORG, wf.id);
      const archived = await workflowSvc.archive(ORG, wf.id);
      expect(archived.status).toBe("archived");
    });

    it("throws on update of archived workflow", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "ev" });
      await workflowSvc.archive(ORG, wf.id);
      await expect(workflowSvc.update(ORG, wf.id, { name: "New" })).rejects.toThrow("archived");
    });

    it("lists workflows by businessId", async () => {
      await workflowSvc.create(ORG, BIZ, { name: "A", triggerEvent: "ev1" });
      await workflowSvc.create(ORG, BIZ, { name: "B", triggerEvent: "ev2" });
      const list = await workflowSvc.list(ORG, BIZ);
      expect(list).toHaveLength(2);
    });

    it("lists workflows by triggerEvent (published only)", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "A", triggerEvent: "lead.converted" });
      await workflowSvc.publish(ORG, wf.id);
      await workflowSvc.create(ORG, BIZ, { name: "B", triggerEvent: "lead.converted" }); // draft
      const found = await workflowSvc.listByTriggerEvent(ORG, "lead.converted");
      expect(found).toHaveLength(1);
      expect(first(found).name).toBe("A");
    });
  });

  describe("WorkflowRunService", () => {
    it("creates and completes a run", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "ev" });
      const run = await workflowRunSvc.create(ORG, BIZ, { workflowId: wf.id, triggeredBy: "user:1" });
      expect(run.status).toBe("pending");

      const completed = await workflowRunSvc.complete(ORG, run.id, { success: true }, 500);
      expect(completed.status).toBe("completed");
      expect(completed.durationMs).toBe(500);
    });

    it("fails a run", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "ev" });
      const run = await workflowRunSvc.create(ORG, BIZ, { workflowId: wf.id, triggeredBy: "user:1" });
      const failed = await workflowRunSvc.fail(ORG, run.id, "timeout", 1000);
      expect(failed.status).toBe("failed");
      expect(failed.errorMessage).toBe("timeout");
    });

    it("cancels a pending run", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "ev" });
      const run = await workflowRunSvc.create(ORG, BIZ, { workflowId: wf.id, triggeredBy: "user:1" });
      const cancelled = await workflowRunSvc.cancel(ORG, run.id);
      expect(cancelled.status).toBe("cancelled");
    });

    it("throws on cancel of completed run", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "WF", triggerEvent: "ev" });
      const run = await workflowRunSvc.create(ORG, BIZ, { workflowId: wf.id, triggeredBy: "user:1" });
      await workflowRunSvc.complete(ORG, run.id, {}, 100);
      await expect(workflowRunSvc.cancel(ORG, run.id)).rejects.toThrow("completed or failed");
    });
  });

  describe("LifecyclePolicyService", () => {
    it("creates a policy", async () => {
      const policy = await policySvc.create(ORG, BIZ, {
        name: "Auto-create Opportunity on lead.converted",
        fromEvent: "lead.converted",
        mode: "automatic",
        action: { type: "create_entity", entity: "opportunity" },
      });
      expect(policy.id).toBeTruthy();
      expect(policy.isActive).toBe(true);
    });

    it("lists policies by event", async () => {
      await policySvc.create(ORG, BIZ, {
        name: "P1",
        fromEvent: "lead.converted",
        mode: "automatic",
        action: { type: "create_entity", entity: "opportunity" },
      });
      await policySvc.create(ORG, BIZ, {
        name: "P2",
        fromEvent: "opportunity.won",
        mode: "manual",
        action: { type: "create_entity", entity: "estimate" },
      });
      const list = await policySvc.listByEvent(ORG, BIZ, "lead.converted");
      expect(list).toHaveLength(1);
      expect(first(list).name).toBe("P1");
    });
  });

  describe("PolicyEngine — evaluate", () => {
    it("returns no_policy when no policies match", async () => {
      const decisions = await engine.evaluate(ORG, BIZ, "lead.converted", {});
      expect(decisions).toHaveLength(1);
      expect(first(decisions).mode).toBe("no_policy");
    });

    it("routes automatic policy to create_entity decision", async () => {
      await policySvc.create(ORG, BIZ, {
        name: "Auto",
        fromEvent: "lead.converted",
        mode: "automatic",
        action: { type: "create_entity", entity: "opportunity" },
      });
      const decisions = await engine.evaluate(ORG, BIZ, "lead.converted", {});
      expect(first(decisions).mode).toBe("automatic");
    });

    it("routes approval_required policy correctly", async () => {
      await policySvc.create(ORG, BIZ, {
        name: "Approval",
        fromEvent: "opportunity.won",
        mode: "approval_required",
        action: { type: "create_entity", entity: "estimate" },
        approvalRoles: ["manager"],
      });
      const decisions = await engine.evaluate(ORG, BIZ, "opportunity.won", {});
      expect(first(decisions).mode).toBe("approval_required");
    });

    it("routes manual policy correctly", async () => {
      await policySvc.create(ORG, BIZ, {
        name: "Manual",
        fromEvent: "estimate.declined",
        mode: "manual",
        action: { type: "create_entity", entity: "lead" },
      });
      const decisions = await engine.evaluate(ORG, BIZ, "estimate.declined", {});
      expect(first(decisions).mode).toBe("manual");
    });

    it("triggers a workflow run for trigger_workflow action", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, { name: "Notify", triggerEvent: "onboard.start" });
      await workflowSvc.publish(ORG, wf.id);

      await policySvc.create(ORG, BIZ, {
        name: "Trigger Onboard",
        fromEvent: "lead.converted",
        mode: "automatic",
        action: { type: "trigger_workflow", workflowKey: "onboard.start" },
      });

      const decisions = await engine.evaluate(ORG, BIZ, "lead.converted", { objectType: "lead", objectId: "lead-1" });
      const decision: PolicyDecision = first(decisions);
      expect(decision.mode).toBe("automatic");
      if (decision.mode === "automatic" && decision.run) {
        expect(decision.run.workflowId).toBe(wf.id);
        expect(decision.run.status).toBe("running");
      }
    });
  });

  describe("E2E lifecycle chain: lead.converted → PolicyEngine → WorkflowRun", () => {
    it("full chain: publish workflow, configure policy, fire event, get run", async () => {
      const wf = await workflowSvc.create(ORG, BIZ, {
        name: "Customer Onboarding",
        triggerEvent: "lead.converted",
      });
      await workflowSvc.publish(ORG, wf.id);

      await policySvc.create(ORG, BIZ, {
        name: "Auto-trigger Onboarding",
        fromEvent: "lead.converted",
        mode: "automatic",
        action: { type: "trigger_workflow", workflowKey: "lead.converted" },
      });

      const decisions = await engine.evaluate(ORG, BIZ, "lead.converted", {
        objectType: "lead",
        objectId: "lead-xyz",
      });

      expect(first(decisions).mode).toBe("automatic");
      const decision: PolicyDecision = first(decisions);
      if (decision.mode === "automatic" && decision.run) {
        const run = await workflowRunSvc.getById(ORG, decision.run.id);
        expect(run.workflowId).toBe(wf.id);
        expect(run.triggeredBy).toMatch(/^policy:/);
        expect(run.status).toBe("running");

        const runs = await workflowRunSvc.listByWorkflow(ORG, wf.id);
        expect(runs).toHaveLength(1);
      }
    });
  });
});
