import { InMemoryEventBus, type BossEvent } from "@boss/events";
import type {
  BusinessEdge,
  CanonicalBusinessContextData,
  GraphSnapshot,
} from "@boss/types";
import { describe, expect, it } from "vitest";
import {
  BusinessContextExecutionGuard,
  BusinessGraphExecutionGuard,
} from "../businessContextRuntime.js";
import { createInMemoryContainer } from "../container.js";
import { InMemoryAuditSink } from "../observability.js";
import { createBusinessContextService } from "../services/businessContextService.js";
import {
  createBusinessGraphService,
} from "../services/businessGraphService.js";
import {
  createGraphRuntime,
  validateGraphSnapshot,
} from "../services/businessGraphRuntime.js";
import { createBusinessSemanticLayer } from "../services/businessSemanticLayer.js";
import { createBusinessQueryService } from "../services/businessQueryService.js";

const orgId = "00000000-0000-4000-8000-000000000201";
const execution = {
  orgId,
  actorId: "user-graph-owner",
  requestId: "request-graph-1",
  correlationId: "correlation-graph-1",
  traceId: "trace-graph-1",
} as const;

function contextData(): CanonicalBusinessContextData {
  return {
    organizationProfile: {
      organizationId: orgId,
      displayName: "Northwind Operations",
      industry: "Professional Services",
      businessModel: "Recurring services",
      locations: ["Chicago"],
    },
    productsAndServices: [
      {
        id: "service-1",
        name: "Managed Operations",
        extensions: { kind: "service" },
      },
    ],
    customerSegments: [{ id: "customer-1", name: "Local operators" }],
    revenueStreams: [
      { id: "revenue-1", name: "Retainers", model: "recurring" },
    ],
    departments: [
      {
        id: "operations",
        name: "Operations",
        owner: "user-graph-owner",
        responsibilities: ["Delivery"],
      },
    ],
    teamStructure: {
      employeeCount: 5,
      leadershipRoles: ["Owner"],
      teams: [{ id: "delivery", name: "Delivery" }],
    },
    goals: [
      {
        id: "goal-1",
        title: "Reduce delivery delays",
        description: "Improve delivery cycle time.",
        status: "active",
      },
    ],
    challenges: [],
    kpis: [
      {
        id: "cycle-time",
        name: "Cycle Time",
        unit: "days",
        currentValue: 8,
        targetValue: 5,
      },
    ],
    complianceRequirements: [],
    extensions: {},
  };
}

async function publishContext(
  service: ReturnType<typeof createBusinessContextService>,
  businessId: string,
) {
  let context = await service.create(
    orgId,
    businessId,
    contextData(),
    { ...execution, businessId },
  );
  for (const status of ["in_progress", "validated", "published"] as const) {
    context = await service.transition(orgId, businessId, status, {
      expectedLockVersion: context.lockVersion,
      reason: `Transition context to ${status}.`,
      execution: { ...execution, businessId },
    });
  }
  return context;
}

describe("Business Knowledge Graph Runtime", () => {
  it("versions, resolves, traverses, validates, caches, and audits a tenant graph", async () => {
    const repos = createInMemoryContainer();
    const business = await repos.businesses.create({
      orgId,
      name: "Northwind Operations",
      industry: "Professional Services",
      employeeCount: 5,
      annualRevenue: 500_000,
    });
    const scopedExecution = { ...execution, businessId: business.id };
    const events: BossEvent<Record<string, unknown>>[] = [];
    const eventBus = new InMemoryEventBus();
    eventBus.subscribe<Record<string, unknown>>("*", (event) => {
      events.push(event);
    });
    const audit = new InMemoryAuditSink();
    const contexts = createBusinessContextService(repos, eventBus, audit);
    const publishedContext = await publishContext(contexts, business.id);
    const graphs = createBusinessGraphService(
      repos,
      contexts,
      eventBus,
      audit,
    );
    const runtime = createGraphRuntime(graphs, eventBus);
    expect(runtime.start().state).toBe("running");
    const semantics = createBusinessSemanticLayer(
      runtime,
      contexts,
      eventBus,
      audit,
    );
    const queries = createBusinessQueryService(
      semantics,
      eventBus,
      audit,
    );

    let graph = await graphs.createFromContext(
      orgId,
      business.id,
      scopedExecution,
    );
    expect(graph).toEqual(
      expect.objectContaining({
        version: 1,
        status: "draft",
        sourceDiscoveryVersion: publishedContext.discoveryVersion,
      }),
    );
    await expect(
      runtime.openSession({
        orgId,
        businessId: business.id,
        execution: scopedExecution,
      }),
    ).rejects.toThrow("requires a published graph");

    const businessNodeId = `business_unit:${business.id}`;
    graph = await graphs.addNode(
      orgId,
      business.id,
      {
        id: "project:delivery-improvement",
        type: "project",
        label: "Delivery Improvement",
        externalRef: "delivery-improvement",
        metadata: {
          source: "test",
          sourceVersion: 1,
          owner: "user-graph-owner",
          extensions: {},
        },
      },
      {
        expectedLockVersion: graph.lockVersion,
        reason: "Add a project node.",
        execution: scopedExecution,
      },
    );
    graph = await graphs.addRelationship(
      orgId,
      business.id,
      {
        id: "edge:owns:business:project",
        sourceNodeId: businessNodeId,
        targetNodeId: "project:delivery-improvement",
        relationship: "owns",
        metadata: {
          source: "test",
          sourceVersion: 1,
          extensions: {},
        },
      },
      {
        expectedLockVersion: graph.lockVersion,
        reason: "Connect the project to its owner.",
        execution: scopedExecution,
      },
    );
    graph = await graphs.addRelationship(
      orgId,
      business.id,
      {
        id: "edge:depends:project:service",
        sourceNodeId: "project:delivery-improvement",
        targetNodeId: "service:service-1",
        relationship: "depends_on",
        metadata: {
          source: "test",
          sourceVersion: 1,
          extensions: {},
        },
      },
      {
        expectedLockVersion: graph.lockVersion,
        reason: "Record the project dependency.",
        execution: scopedExecution,
      },
    );
    const historicalVersion = graph.version;
    graph = await graphs.transition(orgId, business.id, "published", {
      expectedLockVersion: graph.lockVersion,
      reason: "Publish the graph for runtime access.",
      execution: scopedExecution,
    });

    const guard = new BusinessGraphExecutionGuard(
      new BusinessContextExecutionGuard(contexts),
      queries,
    );
    await expect(
      guard.assertReady(business.id, scopedExecution),
    ).resolves.toBeUndefined();

    const session = await runtime.openSession({
      orgId,
      businessId: business.id,
      execution: scopedExecution,
    });
    expect(session.resolver.organization()?.externalRef).toBe(orgId);
    expect(session.resolver.project("delivery-improvement")).toHaveLength(1);
    expect(
      (await session.traversal.dependencies("project:delivery-improvement")).map(
        (node) => node.id,
      ),
    ).toEqual(["service:service-1"]);
    expect(
      (await session.traversal.ancestors("project:delivery-improvement")).map(
        (node) => node.id,
      ),
    ).toContain(businessNodeId);
    expect(
      (await session.traversal.ownership("project:delivery-improvement")).map(
        (node) => node.id,
      ),
    ).toEqual([businessNodeId]);
    const report = await runtime.validate(session);
    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
    runtime.closeSession(session.id);

    const versioned = await runtime.openSession({
      orgId,
      businessId: business.id,
      version: historicalVersion,
      execution: scopedExecution,
      requirePublished: false,
    });
    expect(versioned.context.graphVersion).toBe(historicalVersion);
    runtime.closeSession(versioned.id);
    const cached = await runtime.openSession({
      orgId,
      businessId: business.id,
      version: historicalVersion,
      execution: scopedExecution,
      requirePublished: false,
    });
    runtime.closeSession(cached.id);

    graph = await graphs.addNode(
      orgId,
      business.id,
      {
        id: "document:delivery-playbook",
        type: "document",
        label: "Delivery Playbook",
        metadata: {
          source: "test",
          sourceVersion: 1,
          extensions: {},
        },
      },
      {
        expectedLockVersion: graph.lockVersion,
        reason: "Prove graph-version cache invalidation.",
        execution: scopedExecution,
      },
    );
    const refreshed = await runtime.openSession({
      orgId,
      businessId: business.id,
      execution: scopedExecution,
    });
    expect(refreshed.context.graphVersion).toBe(graph.version);
    expect(refreshed.resolver.byId("document:delivery-playbook")).not.toBeNull();
    runtime.closeSession(refreshed.id);

    expect(runtime.health()).toEqual(
      expect.objectContaining({
        state: "running",
        loads: 5,
        traversals: 3,
        validations: 1,
        cacheHits: 1,
      }),
    );

    expect(await graphs.getCurrent("other-tenant", business.id)).toBeNull();
    expect(await graphs.listVersions(orgId, business.id)).toHaveLength(6);
    expect(await graphs.listHistory(orgId, business.id)).toHaveLength(6);
    expect(audit.list(orgId).map((item) => item.action)).toEqual(
      expect.arrayContaining([
        "business.graph.created",
        "business.node.created",
        "business.relationship.created",
        "business.graph.published",
      ]),
    );
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "business.graph.created",
        "business.graph.versioned",
        "business.graph.loaded",
        "business.graph.traversed",
        "business.graph.validated",
        "business.graph.cache.refreshed",
      ]),
    );
    for (const event of events.filter((item) =>
      item.type.startsWith("business.graph"),
    )) {
      expect(event.payload).toEqual(
        expect.objectContaining({
          tenantId: orgId,
          organizationId: orgId,
          correlationId: execution.correlationId,
          traceId: execution.traceId,
          timestamp: expect.any(String),
        }),
      );
    }
    expect(runtime.shutdown().state).toBe("stopped");
  });

  it("detects cycles, duplicate edges, broken references, and missing owners", () => {
    const node = (id: string, type: "organization" | "project") => ({
      id,
      orgId,
      graphId: "graph-invalid",
      type,
      label: id,
      metadata: {
        source: "test",
        sourceVersion: 1,
        extensions: {},
      },
    });
    const edge = (
      id: string,
      sourceNodeId: string,
      targetNodeId: string,
    ): BusinessEdge => ({
      id,
      orgId,
      graphId: "graph-invalid",
      sourceNodeId,
      targetNodeId,
      relationship: "depends_on",
      metadata: {
        source: "test",
        sourceVersion: 1,
        extensions: {},
      },
    });
    const malformed: GraphSnapshot = {
      graphId: "graph-invalid",
      orgId,
      businessId: "business-invalid",
      version: 3,
      lockVersion: 3,
      status: "draft",
      sourceDiscoveryVersion: 1,
      createdBy: execution.actorId,
      createdAt: new Date().toISOString(),
      nodes: [
        node("organization:root", "organization"),
        node("project:a", "project"),
        node("project:b", "project"),
      ],
      edges: [
        edge("edge:a-b", "project:a", "project:b"),
        edge("edge:b-a", "project:b", "project:a"),
        edge("edge:a-b", "project:a", "missing"),
      ],
      metadata: {
        source: "test",
        sourceVersion: 1,
        extensions: {},
      },
    };

    const report = validateGraphSnapshot(malformed);
    expect(report.valid).toBe(false);
    expect(new Set(report.issues.map((issue) => issue.code))).toEqual(
      new Set([
        "broken_reference",
        "circular_dependency",
        "duplicate_edge",
        "missing_owner",
      ]),
    );
  });
});
