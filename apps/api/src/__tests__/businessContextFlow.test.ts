import { InMemoryEventBus, type BossEvent } from "@boss/events";
import {
  AgentRuntime,
  InMemoryAgentMemoryStore,
  InMemoryRuntimeTelemetry,
  InMemoryWorkflowExecutionStore,
  WorkflowRuntime,
} from "@boss/loop";
import type { CanonicalBusinessContextData } from "@boss/types";
import { describe, expect, it } from "vitest";
import {
  BusinessContextAgentProvider,
  BusinessContextExecutionGuard,
} from "../businessContextRuntime.js";
import { createInMemoryContainer } from "../container.js";
import { InMemoryAuditSink } from "../observability.js";
import { createBusinessContextService } from "../services/businessContextService.js";

const orgId = "00000000-0000-4000-8000-000000000101";

const execution = {
  orgId,
  businessId: "set-after-business-creation",
  actorId: "user-1",
  requestId: "request-1",
  correlationId: "correlation-1",
  traceId: "trace-1",
} as const;

function contextData(
  organizationId = orgId,
  name = "Northwind Services",
): CanonicalBusinessContextData {
  return {
    organizationProfile: {
      organizationId,
      displayName: name,
      industry: "Professional Services",
      businessModel: "Service-based",
      locations: ["Chicago"],
    },
    productsAndServices: [
      { id: "offering-1", name: "Managed Operations" },
    ],
    customerSegments: [
      { id: "segment-1", name: "Local service businesses" },
    ],
    revenueStreams: [
      {
        id: "revenue-1",
        name: "Monthly retainers",
        model: "recurring",
        percentage: 100,
      },
    ],
    departments: [
      {
        id: "department-1",
        name: "Operations",
        responsibilities: ["Service delivery"],
      },
    ],
    teamStructure: {
      employeeCount: 8,
      leadershipRoles: ["Owner"],
      teams: [{ id: "team-1", name: "Delivery" }],
    },
    goals: [
      {
        id: "goal-1",
        title: "Reduce administrative time",
        description: "Recover five owner hours per week.",
        status: "active",
      },
    ],
    challenges: [
      {
        id: "challenge-1",
        title: "Manual scheduling",
        description: "Appointments are coordinated by phone.",
        status: "active",
        severity: "high",
      },
    ],
    kpis: [
      {
        id: "kpi-1",
        name: "Owner administration hours",
        unit: "hours/week",
        currentValue: 12,
        targetValue: 7,
      },
    ],
    complianceRequirements: [
      {
        id: "compliance-1",
        name: "Local data retention",
        status: "required",
      },
    ],
    extensions: {},
  };
}

describe("Canonical Business Context", () => {
  it("persists versions, lifecycle history, events, and tenant-safe resolution", async () => {
    const repos = createInMemoryContainer();
    const business = await repos.businesses.create({
      orgId,
      name: "Northwind Services",
      industry: "Professional Services",
      employeeCount: 8,
      annualRevenue: 750_000,
    });
    const events: BossEvent<Record<string, unknown>>[] = [];
    const eventBus = new InMemoryEventBus();
    eventBus.subscribe<Record<string, unknown>>("*", (event) => {
      events.push(event);
    });
    const audit = new InMemoryAuditSink();
    const service = createBusinessContextService(repos, eventBus, audit);
    const scopedExecution = { ...execution, businessId: business.id };

    const created = await service.create(
      orgId,
      business.id,
      contextData(),
      scopedExecution,
    );
    expect(created).toEqual(
      expect.objectContaining({
        status: "draft",
        discoveryVersion: 1,
        lockVersion: 1,
        activeGoals: [expect.objectContaining({ id: "goal-1" })],
      }),
    );

    const updated = await service.update(
      orgId,
      business.id,
      contextData(orgId, "Northwind Operations"),
      {
        expectedLockVersion: created.lockVersion,
        reason: "Owner confirmed the operating name.",
        execution: scopedExecution,
      },
    );
    expect(updated.discoveryVersion).toBe(2);
    await expect(
      service.update(orgId, business.id, contextData(), {
        expectedLockVersion: created.lockVersion,
        reason: "Stale write.",
        execution: scopedExecution,
      }),
    ).rejects.toThrow("modified by another request");

    let current = await service.transition(
      orgId,
      business.id,
      "in_progress",
      {
        expectedLockVersion: updated.lockVersion,
        reason: "Guided discovery started.",
        execution: scopedExecution,
      },
    );
    current = await service.transition(orgId, business.id, "validated", {
      expectedLockVersion: current.lockVersion,
      reason: "Required foundational fields confirmed.",
      execution: scopedExecution,
    });

    const guard = new BusinessContextExecutionGuard(service);
    await expect(
      guard.assertReady(business.id, scopedExecution),
    ).rejects.toThrow("requires published Business Context");

    current = await service.transition(orgId, business.id, "published", {
      expectedLockVersion: current.lockVersion,
      reason: "Owner approved canonical context.",
      execution: scopedExecution,
    });
    await expect(
      guard.assertReady(business.id, scopedExecution),
    ).resolves.toBeUndefined();

    const workflow = new WorkflowRuntime(
      new InMemoryWorkflowExecutionStore(),
      eventBus,
      new InMemoryRuntimeTelemetry(),
      { get: (id: string) => (id === "context-test" ? { id } : undefined) },
      guard,
    );
    const workflowResult = await workflow.execute(
      {
        id: "context-test",
        steps: [
          {
            id: "resolve",
            kind: "action",
            execute: async () => "context-resolved",
          },
        ],
      },
      business.id,
      {},
      scopedExecution,
    );
    expect(workflowResult.state).toBe("completed");

    const agent = new AgentRuntime(
      {
        execute: async (input) => ({
          status: (
            input.retrievedContext.businessContext as {
              status: string;
            }
          ).status,
        }),
      },
      new BusinessContextAgentProvider(guard),
      new InMemoryAgentMemoryStore(),
      new Map(),
      eventBus,
      new InMemoryRuntimeTelemetry(),
      undefined,
      undefined,
      guard,
    );
    agent.activate("ceo_advisor");
    const agentResult = await agent.execute(
      "ceo_advisor",
      {},
      scopedExecution,
    );
    expect(agentResult).toEqual(
      expect.objectContaining({
        state: "completed",
        output: { status: "published" },
      }),
    );

    current = await service.transition(orgId, business.id, "archived", {
      expectedLockVersion: current.lockVersion,
      reason: "Superseded after business closure.",
      execution: scopedExecution,
    });
    expect(current.status).toBe("archived");

    expect(await service.listVersions(orgId, business.id)).toHaveLength(2);
    expect(await service.listHistory(orgId, business.id)).toHaveLength(6);
    expect(await service.getCurrent("other-org", business.id)).toBeNull();
    expect(audit.list(orgId)).toHaveLength(6);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "business.discovery.created",
        "business.discovery.updated",
        "business.discovery.validated",
        "business.context.published",
        "workflow.started",
        "workflow.completed",
      ]),
    );
    for (const event of events.filter((item) =>
      item.type.startsWith("business."),
    )) {
      expect(event.payload).toEqual(
        expect.objectContaining({
          tenantId: orgId,
          organizationId: orgId,
          correlationId: "correlation-1",
          traceId: "trace-1",
          timestamp: expect.any(String),
        }),
      );
    }
  });

  it("rejects cross-tenant context and invalid lifecycle shortcuts", async () => {
    const repos = createInMemoryContainer();
    const business = await repos.businesses.create({
      orgId,
      name: "Northwind",
      industry: "Services",
      employeeCount: 1,
      annualRevenue: 100_000,
    });
    const service = createBusinessContextService(repos);
    const scopedExecution = { ...execution, businessId: business.id };

    await expect(
      service.create(
        orgId,
        business.id,
        contextData("other-org"),
        scopedExecution,
      ),
    ).rejects.toThrow("not tenant-scoped");

    const created = await service.create(
      orgId,
      business.id,
      contextData(),
      scopedExecution,
    );
    await expect(
      service.transition(orgId, business.id, "published", {
        expectedLockVersion: created.lockVersion,
        reason: "Invalid shortcut.",
        execution: scopedExecution,
      }),
    ).rejects.toThrow("cannot transition from draft to published");
  });
});
