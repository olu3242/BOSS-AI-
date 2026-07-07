import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createWorkflowService } from "../services/workflowService.js";
import { createLifecyclePolicyService } from "../services/lifecyclePolicyService.js";
import { installLifecycleChain } from "../services/lifecycleChainService.js";
import { createBossEvent } from "@boss/events";
import { randomUUID } from "node:crypto";

const ORG = "org-chain";
const BIZ = "biz-chain";

function ctx(orgId: string, businessId: string) {
  return { orgId, businessId, actorId: "test", requestId: randomUUID(), correlationId: randomUUID(), traceId: randomUUID() };
}

describe("Wave 1A — LifecycleChain event wiring", () => {
  let repos: ReturnType<typeof createInMemoryContainer>;
  let workflowSvc: ReturnType<typeof createWorkflowService>;
  let policySvc: ReturnType<typeof createLifecyclePolicyService>;

  beforeEach(() => {
    repos = createInMemoryContainer();
    workflowSvc = createWorkflowService(repos.workflows);
    policySvc = createLifecyclePolicyService(repos.lifecyclePolicies);
    installLifecycleChain(repos);
  });

  it("lead.converted fires PolicyEngine for matching automatic policy", async () => {
    const wf = await workflowSvc.create(ORG, BIZ, { name: "Create Opp", triggerEvent: "lead.converted" });
    await workflowSvc.publish(ORG, wf.id);

    await policySvc.create(ORG, BIZ, {
      name: "Auto-create Opportunity",
      fromEvent: "lead.converted",
      mode: "automatic",
      action: { type: "trigger_workflow", workflowKey: "lead.converted" },
    });

    // Fire the event through the event bus
    await repos.eventBus.publish(
      createBossEvent("lead.converted", { orgId: ORG, businessId: BIZ, leadId: "lead-1" }, ctx(ORG, BIZ)),
    );

    // Give async subscriber a tick to execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    // A WorkflowRun should have been created automatically
    const runs = await repos.workflowRuns.listByWorkflow(ORG, wf.id);
    expect(runs.length).toBeGreaterThan(0);
    const run = runs[0];
    if (!run) throw new Error("Expected a workflow run");
    expect(run.triggeredBy).toMatch(/^policy:/);
    expect(run.businessObjectType).toBe("lead");
    expect(run.businessObjectId).toBe("lead-1");
  });

  it("opportunity.won fires PolicyEngine for matching policy", async () => {
    await policySvc.create(ORG, BIZ, {
      name: "Request estimate on win",
      fromEvent: "opportunity.won",
      mode: "approval_required",
      action: { type: "create_entity", entity: "estimate" },
      approvalRoles: ["sales-manager"],
    });

    const published: string[] = [];
    repos.eventBus.subscribe("loop.step.pending_approval", (e) => {
      published.push((e.payload as Record<string, unknown>)["fromEvent"] as string);
    });

    await repos.eventBus.publish(
      createBossEvent("opportunity.won", { orgId: ORG, businessId: BIZ, opportunityId: "opp-1" }, ctx(ORG, BIZ)),
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(published).toContain("opportunity.won");
  });

  it("no policy match produces no side effects", async () => {
    // install chain with no policies configured
    await repos.eventBus.publish(
      createBossEvent("invoice.paid", { orgId: ORG, businessId: BIZ, invoiceId: "inv-1" }, ctx(ORG, BIZ)),
    );

    await new Promise((resolve) => setTimeout(resolve, 10));

    const runs = await repos.workflowRuns.listByBusinessId(ORG, BIZ);
    expect(runs).toHaveLength(0);
  });

  it("full chain: lead.converted → job.completed emits loop events for each hop", async () => {
    // Configure policies for the full lifecycle chain
    const events = [
      "lead.converted",
      "opportunity.won",
      "estimate.accepted",
      "appointment.completed",
      "job.completed",
    ];

    for (const fromEvent of events) {
      await policySvc.create(ORG, BIZ, {
        name: `Manual: ${fromEvent}`,
        fromEvent,
        mode: "manual",
        action: { type: "create_entity", entity: "next" },
      });
    }

    const manualEvents: string[] = [];
    repos.eventBus.subscribe("loop.step.manual_required", (e) => {
      manualEvents.push((e.payload as Record<string, unknown>)["fromEvent"] as string);
    });

    // Fire each event
    for (const fromEvent of events) {
      await repos.eventBus.publish(
        createBossEvent(fromEvent, { orgId: ORG, businessId: BIZ }, ctx(ORG, BIZ)),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 20));

    for (const fromEvent of events) {
      expect(manualEvents).toContain(fromEvent);
    }
  });
});
