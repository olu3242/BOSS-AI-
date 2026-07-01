import { InMemoryEventBus, type BossEvent } from "@boss/events";
import {
  AgentRuntime,
  InMemoryAgentMemoryStore,
  InMemoryRuntimeTelemetry,
  InMemoryWorkflowExecutionStore,
  WorkflowRuntime,
} from "@boss/loop";
import type {
  BusinessNode,
  CanonicalBusinessContextData,
  GraphMetadata,
} from "@boss/types";
import { describe, expect, it } from "vitest";
import {
  BusinessContextExecutionGuard,
  BusinessQueryAgentProvider,
  BusinessQueryExecutionGuard,
} from "../businessContextRuntime.js";
import { createInMemoryContainer } from "../container.js";
import { InMemoryAuditSink } from "../observability.js";
import { createBusinessContextService } from "../services/businessContextService.js";
import { createGraphRuntime } from "../services/businessGraphRuntime.js";
import { createBusinessGraphService } from "../services/businessGraphService.js";
import {
  ContextResolutionService,
  createBusinessSemanticLayer,
  DependencyResolutionService,
} from "../services/businessSemanticLayer.js";
import { createBusinessQueryService } from "../services/businessQueryService.js";

const orgId = "00000000-0000-4000-8000-000000000301";
const execution = {
  orgId,
  actorId: "semantic-owner",
  requestId: "semantic-request",
  correlationId: "semantic-correlation",
  traceId: "semantic-trace",
} as const;

const metadata: GraphMetadata = {
  source: "semantic-test",
  sourceVersion: 1,
  extensions: {},
};

function contextData(): CanonicalBusinessContextData {
  return {
    organizationProfile: {
      organizationId: orgId,
      displayName: "Semantic Services",
      industry: "Professional Services",
      businessModel: "Recurring services",
      locations: ["Chicago"],
    },
    productsAndServices: [
      {
        id: "offering-1",
        name: "Operations Platform",
        extensions: { kind: "product" },
      },
    ],
    customerSegments: [{ id: "customer-1", name: "SMB operators" }],
    revenueStreams: [
      { id: "revenue-1", name: "Subscriptions", model: "recurring" },
    ],
    departments: [
      {
        id: "operations",
        name: "Operations",
        responsibilities: ["Delivery"],
      },
    ],
    teamStructure: {
      employeeCount: 6,
      leadershipRoles: ["Owner"],
      teams: [{ id: "delivery", name: "Delivery" }],
    },
    goals: [
      {
        id: "goal-1",
        title: "Improve delivery",
        description: "Reduce handoff delays.",
        status: "active",
      },
    ],
    challenges: [],
    kpis: [
      {
        id: "kpi-1",
        name: "Delivery Time",
        unit: "days",
        currentValue: 8,
        targetValue: 5,
      },
    ],
    complianceRequirements: [
      { id: "policy-1", name: "Data Retention", status: "required" },
    ],
    extensions: {},
  };
}

describe("Business Semantic Layer", () => {
  it("provides deterministic, versioned business meaning without graph leakage", async () => {
    const repos = createInMemoryContainer();
    const business = await repos.businesses.create({
      orgId,
      name: "Semantic Services",
      industry: "Professional Services",
      employeeCount: 6,
      annualRevenue: 900_000,
    });
    const scopedExecution = { ...execution, businessId: business.id };
    const eventBus = new InMemoryEventBus();
    const events: BossEvent<Record<string, unknown>>[] = [];
    eventBus.subscribe<Record<string, unknown>>("*", (event) => {
      events.push(event);
    });
    const audit = new InMemoryAuditSink();
    const contexts = createBusinessContextService(repos, eventBus, audit);
    let context = await contexts.create(
      orgId,
      business.id,
      contextData(),
      scopedExecution,
    );
    for (const status of ["in_progress", "validated", "published"] as const) {
      context = await contexts.transition(orgId, business.id, status, {
        expectedLockVersion: context.lockVersion,
        reason: `Transition to ${status}.`,
        execution: scopedExecution,
      });
    }

    const graphs = createBusinessGraphService(
      repos,
      contexts,
      eventBus,
      audit,
    );
    const graphRuntime = createGraphRuntime(graphs, eventBus);
    graphRuntime.start();
    const semantics = createBusinessSemanticLayer(
      graphRuntime,
      contexts,
      eventBus,
      audit,
    );
    const queries = createBusinessQueryService(
      semantics,
      eventBus,
      audit,
    );
    const resolution = new ContextResolutionService(semantics);
    const dependencies = new DependencyResolutionService(semantics);
    let graph = await graphs.createFromContext(
      orgId,
      business.id,
      scopedExecution,
    );

    const additionalNodes: readonly Omit<
      BusinessNode,
      "orgId" | "graphId"
    >[] = [
      {
        id: "project:project-1",
        type: "project",
        label: "Delivery Improvement",
        externalRef: "project-1",
        metadata,
      },
      {
        id: "workflow:workflow-1",
        type: "workflow",
        label: "Delivery Workflow",
        externalRef: "workflow-1",
        metadata,
      },
      {
        id: "automation:automation-1",
        type: "automation",
        label: "Delivery Automation",
        externalRef: "automation-1",
        metadata,
      },
      {
        id: "ai_agent:agent-1",
        type: "ai_agent",
        label: "Operations Analyst",
        externalRef: "agent-1",
        metadata,
      },
      {
        id: "vendor:vendor-1",
        type: "vendor",
        label: "Infrastructure Vendor",
        externalRef: "vendor-1",
        metadata,
      },
    ];
    for (const node of additionalNodes) {
      graph = await graphs.addNode(orgId, business.id, node, {
        expectedLockVersion: graph.lockVersion,
        reason: `Add ${node.id}.`,
        execution: scopedExecution,
      });
    }

    const businessNodeId = `business_unit:${business.id}`;
    const relationships = [
      {
        id: "edge:business-project",
        sourceNodeId: businessNodeId,
        targetNodeId: "project:project-1",
        relationship: "owns" as const,
      },
      {
        id: "edge:project-product",
        sourceNodeId: "project:project-1",
        targetNodeId: "product:offering-1",
        relationship: "depends_on" as const,
      },
      {
        id: "edge:workflow-project",
        sourceNodeId: "workflow:workflow-1",
        targetNodeId: "project:project-1",
        relationship: "executes" as const,
      },
      {
        id: "edge:automation-workflow",
        sourceNodeId: "automation:automation-1",
        targetNodeId: "workflow:workflow-1",
        relationship: "executes" as const,
      },
      {
        id: "edge:agent-automation",
        sourceNodeId: "ai_agent:agent-1",
        targetNodeId: "automation:automation-1",
        relationship: "supports" as const,
      },
    ];
    for (const edge of relationships) {
      graph = await graphs.addRelationship(
        orgId,
        business.id,
        { ...edge, metadata },
        {
          expectedLockVersion: graph.lockVersion,
          reason: `Add ${edge.id}.`,
          execution: scopedExecution,
        },
      );
    }
    graph = await graphs.transition(orgId, business.id, "published", {
      expectedLockVersion: graph.lockVersion,
      reason: "Publish semantic source graph.",
      execution: scopedExecution,
    });
    const publishedVersion = graph.version;

    const request = {
      orgId,
      businessId: business.id,
      execution: scopedExecution,
    };
    const first = await semantics.load(request);
    const memoized = await semantics.load(request);
    expect(memoized).toBe(first);
    expect(first.context).toEqual(
      expect.objectContaining({
        semanticVersion: publishedVersion,
        graphVersion: publishedVersion,
        discoveryVersion: context.discoveryVersion,
        lifecycle: "active",
      }),
    );
    expect(first.context.organization.attributes).toEqual(
      expect.objectContaining({
        industry: "Professional Services",
        businessModel: "Recurring services",
      }),
    );
    expect(first.context.entities[0]).not.toHaveProperty("graphId");
    expect(first.context.relationships[0]).not.toHaveProperty("sourceNodeId");
    expect(
      first.context.relationships.every((item) =>
        item.sourceEntityId.startsWith("semantic:"),
      ),
    ).toBe(true);

    const semanticGuard = new BusinessQueryExecutionGuard(
      new BusinessContextExecutionGuard(contexts),
      queries,
    );
    const workflow = new WorkflowRuntime(
      new InMemoryWorkflowExecutionStore(),
      eventBus,
      new InMemoryRuntimeTelemetry(),
      {
        get: (id: string) =>
          id === "semantic-workflow" ? { id } : undefined,
      },
      semanticGuard,
    );
    expect(
      (
        await workflow.execute(
          {
            id: "semantic-workflow",
            steps: [
              {
                id: "resolve",
                kind: "action",
                execute: async () => "semantic-context-resolved",
              },
            ],
          },
          business.id,
          {},
          scopedExecution,
        )
      ).state,
    ).toBe("completed");

    const agent = new AgentRuntime(
      {
        execute: async (input) => ({
          semanticVersion: (
            input.retrievedContext.businessQueryContext as {
              execution: { semanticVersion: number };
            }
          ).execution.semanticVersion,
        }),
      },
      new BusinessQueryAgentProvider(semanticGuard),
      new InMemoryAgentMemoryStore(),
      new Map(),
      eventBus,
      new InMemoryRuntimeTelemetry(),
      undefined,
      undefined,
      semanticGuard,
    );
    agent.activate("ceo_advisor");
    expect(
      await agent.execute("ceo_advisor", {}, scopedExecution),
    ).toEqual(
      expect.objectContaining({
        state: "completed",
        output: { semanticVersion: publishedVersion },
      }),
    );

    expect(await resolution.resolveOrganization(request)).toEqual(
      expect.objectContaining({ type: "organization" }),
    );
    expect(await resolution.resolveDepartments(request)).toHaveLength(1);
    expect(await resolution.resolveTeams(request)).toHaveLength(1);
    expect(await resolution.resolveCustomers(request)).toHaveLength(1);
    expect(await resolution.resolveVendors(request)).toHaveLength(1);
    expect(await resolution.resolveProducts(request)).toHaveLength(1);
    expect(await resolution.resolveProjects(request)).toHaveLength(1);
    expect(await resolution.resolveWorkflows(request)).toHaveLength(1);
    expect(await resolution.resolveAutomations(request)).toHaveLength(1);
    expect(await resolution.resolveAIExecution(request)).toHaveLength(1);

    const executive = await resolution.resolveExecutiveContext(request);
    const operations = await semantics.createView(request, "operations");
    expect(executive.graphVersion).toBe(publishedVersion);
    expect(operations.entities.map((item) => item.type)).toEqual(
      expect.arrayContaining(["department", "team", "project", "workflow"]),
    );
    expect(await semantics.createView(request, "operations")).toBe(operations);

    const projectId = "semantic:project:project-1";
    expect(
      (await dependencies.resolve(request, projectId, "ownership")).related,
    ).toEqual([
      expect.objectContaining({
        id: `semantic:${businessNodeId}`,
      }),
    ]);
    expect(
      (
        await dependencies.resolve(
          request,
          projectId,
          "business_dependencies",
        )
      ).related,
    ).toEqual([
      expect.objectContaining({ id: "semantic:product:offering-1" }),
    ]);
    expect(
      (
        await dependencies.resolve(
          request,
          "semantic:ai_agent:agent-1",
          "execution_scope",
        )
      ).related,
    ).toEqual([
      expect.objectContaining({
        id: "semantic:automation:automation-1",
      }),
    ]);
    expect(semantics.cacheHealth()).toEqual({ contexts: 1, views: 2 });

    graph = await graphs.addNode(
      orgId,
      business.id,
      {
        id: "document:playbook",
        type: "document",
        label: "Operations Playbook",
        externalRef: "playbook",
        metadata,
      },
      {
        expectedLockVersion: graph.lockVersion,
        reason: "Version graph and invalidate semantic caches.",
        execution: scopedExecution,
      },
    );
    expect(semantics.cacheHealth()).toEqual({ contexts: 0, views: 0 });
    const refreshed = await semantics.load(request);
    expect(refreshed.context.semanticVersion).toBe(graph.version);
    expect(
      refreshed.context.entities.some(
        (entity) => entity.id === "semantic:document:playbook",
      ),
    ).toBe(true);

    const historical = await semantics.load({
      ...request,
      graphVersion: publishedVersion,
    });
    expect(historical.context.lifecycle).toBe("historical");
    expect(historical.context.graphVersion).toBe(publishedVersion);
    expect(
      historical.context.entities.some(
        (entity) => entity.id === "semantic:document:playbook",
      ),
    ).toBe(false);

    await expect(
      semantics.load({
        ...request,
        orgId: "other-tenant",
      }),
    ).rejects.toThrow("tenant does not match");

    const eventTypes = events.map((event) => event.type);
    for (const eventType of [
      "business.semantic.loaded",
      "business.context.resolved",
      "business.semantic.view.created",
      "business.semantic.updated",
    ]) {
      expect(eventTypes).toContain(eventType);
    }
    for (const event of events.filter(
      (item) =>
        item.type.startsWith("business.semantic") ||
        item.type === "business.context.resolved",
    )) {
      expect(event.payload).toEqual(
        expect.objectContaining({
          tenantId: orgId,
          organizationId: orgId,
          semanticVersion: expect.any(Number),
          graphVersion: expect.any(Number),
          correlationId: execution.correlationId,
          traceId: execution.traceId,
          timestamp: expect.any(String),
        }),
      );
    }
    expect(audit.list(orgId).map((item) => item.action)).toEqual(
      expect.arrayContaining([
        "business.semantic.loaded",
        "business.context.resolved",
        "business.semantic.view.created",
      ]),
    );
  });
});
