import { InMemoryEventBus, type BossEvent } from "@boss/events";
import type {
  BusinessNode,
  CanonicalBusinessContextData,
  GraphMetadata,
} from "@boss/types";
import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { InMemoryAuditSink } from "../observability.js";
import { createBusinessContextService } from "../services/businessContextService.js";
import { createGraphRuntime } from "../services/businessGraphRuntime.js";
import { createBusinessGraphService } from "../services/businessGraphService.js";
import {
  createBusinessQueryService,
} from "../services/businessQueryService.js";
import { createBusinessSemanticLayer } from "../services/businessSemanticLayer.js";

const orgId = "00000000-0000-4000-8000-000000000401";
const execution = {
  orgId,
  actorId: "query-owner",
  requestId: "query-request",
  correlationId: "query-correlation",
  traceId: "query-trace",
} as const;

const metadata: GraphMetadata = {
  source: "query-test",
  sourceVersion: 1,
  extensions: {},
};

function contextData(): CanonicalBusinessContextData {
  return {
    organizationProfile: {
      organizationId: orgId,
      displayName: "Query Services",
      industry: "Professional Services",
      businessModel: "Recurring services",
      locations: ["Chicago"],
    },
    productsAndServices: [
      {
        id: "product-1",
        name: "Operations Platform",
        extensions: { kind: "product" },
      },
    ],
    customerSegments: [
      { id: "customer-1", name: "Regional operators" },
      { id: "customer-2", name: "Independent operators" },
    ],
    revenueStreams: [
      { id: "revenue-1", name: "Subscriptions", model: "recurring" },
    ],
    departments: [
      {
        id: "operations",
        name: "Operations",
        responsibilities: ["Delivery"],
      },
      {
        id: "sales",
        name: "Sales",
        responsibilities: ["Revenue"],
      },
    ],
    teamStructure: {
      employeeCount: 8,
      leadershipRoles: ["Owner"],
      teams: [{ id: "delivery", name: "Delivery" }],
    },
    goals: [
      {
        id: "goal-1",
        title: "Improve delivery",
        description: "Reduce cycle time.",
        status: "active",
      },
    ],
    challenges: [],
    kpis: [
      {
        id: "kpi-1",
        name: "Cycle Time",
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

describe("Business Query & Insight Layer", () => {
  it("serves deterministic canonical queries and invalidates by semantic version", async () => {
    const repos = createInMemoryContainer();
    const business = await repos.businesses.create({
      orgId,
      name: "Query Services",
      industry: "Professional Services",
      employeeCount: 8,
      annualRevenue: 1_200_000,
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
    let graph = await graphs.createFromContext(
      orgId,
      business.id,
      scopedExecution,
    );
    const executionNodes: readonly Omit<
      BusinessNode,
      "orgId" | "graphId"
    >[] = [
      {
        id: "workflow:workflow-1",
        type: "workflow",
        label: "Delivery Workflow",
        metadata,
      },
      {
        id: "automation:automation-1",
        type: "automation",
        label: "Delivery Automation",
        metadata,
      },
      {
        id: "ai_agent:agent-1",
        type: "ai_agent",
        label: "Operations Analyst",
        metadata,
      },
    ];
    for (const node of executionNodes) {
      graph = await graphs.addNode(orgId, business.id, node, {
        expectedLockVersion: graph.lockVersion,
        reason: `Add ${node.id}.`,
        execution: scopedExecution,
      });
    }
    const businessNodeId = `business_unit:${business.id}`;
    for (const [id, targetNodeId] of [
      ["edge:owns:workflow", "workflow:workflow-1"],
      ["edge:owns:automation", "automation:automation-1"],
      ["edge:owns:agent", "ai_agent:agent-1"],
    ] as const) {
      graph = await graphs.addRelationship(
        orgId,
        business.id,
        {
          id,
          sourceNodeId: businessNodeId,
          targetNodeId,
          relationship: "owns",
          metadata,
        },
        {
          expectedLockVersion: graph.lockVersion,
          reason: `Add ${id}.`,
          execution: scopedExecution,
        },
      );
    }
    graph = await graphs.transition(orgId, business.id, "published", {
      expectedLockVersion: graph.lockVersion,
      reason: "Publish query source graph.",
      execution: scopedExecution,
    });
    const publishedVersion = graph.version;
    const catalog = queries.catalog();
    expect(catalog).toHaveLength(14);
    expect(new Set(catalog.map((item) => item.id)).size).toBe(14);

    for (const definition of catalog) {
      const result = await queries.execute({
        queryId: definition.id,
        orgId,
        businessId: business.id,
        execution: scopedExecution,
      });
      expect(result.definition.version).toBe("1.0.0");
      expect(result.execution).toEqual(
        expect.objectContaining({
          semanticVersion: publishedVersion,
          graphVersion: publishedVersion,
          discoveryVersion: context.discoveryVersion,
          cacheHit: false,
        }),
      );
      expect(
        result.insights.every((insight) =>
          [
            "entity_count",
            "relationship_total",
            "missing_information",
            "lifecycle_state",
            "context_completeness",
            "execution_statistic",
          ].includes(insight.type),
        ),
      ).toBe(true);
    }

    const request = {
      queryId: "organization_summary" as const,
      orgId,
      businessId: business.id,
      execution: scopedExecution,
    };
    const first = await queries.execute(request);
    const second = await queries.execute(request);
    expect(second.view).toBe(first.view);
    expect(second.insights).toBe(first.insights);
    expect(second.execution.cacheHit).toBe(true);
    expect(second.execution.id).not.toBe(first.execution.id);

    const pageOne = await queries.execute({
      queryId: "department_overview",
      orgId,
      businessId: business.id,
      execution: scopedExecution,
      limit: 1,
    });
    expect(pageOne.view.projections[0]).toEqual(
      expect.objectContaining({
        totalCount: 3,
        nextCursor: "1",
      }),
    );
    const pageTwo = await queries.execute({
      queryId: "department_overview",
      orgId,
      businessId: business.id,
      execution: scopedExecution,
      limit: 1,
      cursor: "1",
    });
    expect(pageTwo.view.projections[0]?.items).toHaveLength(1);

    const streamed: string[] = [];
    for await (const item of queries.stream({
      queryId: "customer_portfolio",
      orgId,
      businessId: business.id,
      execution: scopedExecution,
      limit: 1,
    })) {
      streamed.push(item.id);
    }
    expect(streamed).toHaveLength(1);

    const beforeUpdate = queries.performance();
    expect(beforeUpdate).toEqual(
      expect.objectContaining({
        executions: 19,
        cacheHits: 2,
        cacheMisses: 17,
        queryCacheEntries: 17,
        projectionCacheEntries: 17,
        contextCacheEntries: 1,
      }),
    );
    expect(beforeUpdate.averageQueryLatencyMs).toBeGreaterThanOrEqual(0);
    expect(beforeUpdate.averageQueryLatencyMs).toBeLessThan(1_000);
    expect(
      beforeUpdate.averageProjectionGenerationMs,
    ).toBeGreaterThanOrEqual(0);
    expect(beforeUpdate.averageProjectionGenerationMs).toBeLessThan(1_000);
    expect(beforeUpdate.cacheHitRatio).toBeCloseTo(2 / 19);

    graph = await graphs.addNode(
      orgId,
      business.id,
      {
        id: "document:query-playbook",
        type: "document",
        label: "Query Playbook",
        metadata,
      },
      {
        expectedLockVersion: graph.lockVersion,
        reason: "Invalidate BQIL caches.",
        execution: scopedExecution,
      },
    );
    expect(queries.performance()).toEqual(
      expect.objectContaining({
        queryCacheEntries: 0,
        projectionCacheEntries: 0,
        contextCacheEntries: 0,
      }),
    );
    const refreshed = await queries.execute(request);
    expect(refreshed.execution.semanticVersion).toBe(graph.version);
    expect(refreshed.execution.cacheHit).toBe(false);

    const historical = await queries.execute({
      ...request,
      graphVersion: publishedVersion,
    });
    expect(historical.execution.semanticVersion).toBe(publishedVersion);
    expect(historical.view.lifecycle).toBe("historical");

    await expect(
      queries.execute({
        ...request,
        orgId: "other-tenant",
      }),
    ).rejects.toThrow("tenant does not match");

    const eventTypes = events.map((event) => event.type);
    for (const type of [
      "business.query.executed",
      "business.view.generated",
      "business.projection.generated",
      "business.insight.generated",
    ]) {
      expect(eventTypes).toContain(type);
    }
    for (const event of events.filter((item) =>
      item.type.startsWith("business.query") ||
      item.type === "business.view.generated" ||
      item.type === "business.projection.generated" ||
      item.type === "business.insight.generated",
    )) {
      expect(event.payload).toEqual(
        expect.objectContaining({
          tenantId: orgId,
          organizationId: orgId,
          queryId: expect.any(String),
          semanticVersion: expect.any(Number),
          graphVersion: expect.any(Number),
          correlationId: execution.correlationId,
          traceId: execution.traceId,
          timestamp: expect.any(String),
        }),
      );
    }
    expect(audit.list(orgId).map((entry) => entry.action)).toContain(
      "business.query.executed",
    );
  });
});
