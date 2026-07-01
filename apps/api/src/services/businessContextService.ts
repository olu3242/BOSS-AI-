import { createBossEvent, InMemoryEventBus, type EventBus, type EventContext } from "@boss/events";
import type {
  BusinessContextSnapshot,
  BusinessDiscoveryHistoryEntry,
  BusinessDiscoveryStatus,
  CanonicalBusinessContextData,
  ResolvedBusinessContext,
} from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import {
  createAuditEvent,
  InMemoryAuditSink,
  type AuditSink,
} from "../observability.js";

const SCHEMA_VERSION = "1.0.0";

const allowedTransitions = Object.freeze({
  draft: Object.freeze(["in_progress"]),
  in_progress: Object.freeze(["validated"]),
  validated: Object.freeze(["published"]),
  published: Object.freeze(["archived"]),
  archived: Object.freeze([]),
} as const satisfies Readonly<
  Record<BusinessDiscoveryStatus, readonly BusinessDiscoveryStatus[]>
>);

export interface BusinessContextMutation {
  readonly expectedLockVersion: number;
  readonly reason: string;
  readonly execution: EventContext;
}

export interface BusinessContextService {
  create(
    orgId: string,
    businessId: string,
    context: CanonicalBusinessContextData,
    execution: EventContext,
  ): Promise<ResolvedBusinessContext>;
  update(
    orgId: string,
    businessId: string,
    context: CanonicalBusinessContextData,
    mutation: BusinessContextMutation,
  ): Promise<ResolvedBusinessContext>;
  transition(
    orgId: string,
    businessId: string,
    status: BusinessDiscoveryStatus,
    mutation: BusinessContextMutation,
  ): Promise<ResolvedBusinessContext>;
  getCurrent(
    orgId: string,
    businessId: string,
  ): Promise<ResolvedBusinessContext | null>;
  listVersions(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessContextSnapshot[]>;
  listHistory(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessDiscoveryHistoryEntry[]>;
}

function assertTenant(orgId: string, execution: EventContext): void {
  if (execution.orgId !== orgId) {
    throw new Error(
      "Business Context execution tenant does not match the requested organization.",
    );
  }
}

function assertContextData(
  orgId: string,
  context: CanonicalBusinessContextData,
  complete: boolean,
): void {
  if (context.organizationProfile.organizationId !== orgId) {
    throw new Error("Business Context organization profile is not tenant-scoped.");
  }
  if (context.teamStructure.employeeCount < 0) {
    throw new Error("Business Context employee count cannot be negative.");
  }
  for (const stream of context.revenueStreams) {
    if (
      stream.percentage !== undefined &&
      (stream.percentage < 0 || stream.percentage > 100)
    ) {
      throw new Error("Revenue stream percentages must be between 0 and 100.");
    }
  }
  const ids = [
    ...context.productsAndServices,
    ...context.customerSegments,
    ...context.revenueStreams,
    ...context.departments,
    ...context.teamStructure.teams,
    ...context.goals,
    ...context.challenges,
    ...context.kpis,
    ...context.complianceRequirements,
  ].map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Business Context entity IDs must be unique.");
  }
  const metadataEntries = [
    context.organizationProfile,
    context.teamStructure,
    ...context.productsAndServices,
    ...context.customerSegments,
    ...context.revenueStreams,
    ...context.departments,
    ...context.teamStructure.teams,
    ...context.goals,
    ...context.challenges,
    ...context.kpis,
    ...context.complianceRequirements,
  ];
  if (
    metadataEntries.some(
      (entry) =>
        entry.confidence !== undefined &&
        (entry.confidence < 0 || entry.confidence > 1),
    )
  ) {
    throw new Error("Business Context confidence must be between 0 and 1.");
  }
  if (
    complete &&
    (!context.organizationProfile.displayName.trim() ||
      !context.organizationProfile.industry.trim() ||
      !context.organizationProfile.businessModel.trim() ||
      context.productsAndServices.length === 0)
  ) {
    throw new Error(
      "Validated Business Context requires organization identity, industry, business model, and an offering.",
    );
  }
}

function eventPayload(
  snapshot: BusinessContextSnapshot,
  timestamp: string,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    tenantId: snapshot.orgId,
    organizationId: snapshot.orgId,
    businessId: snapshot.businessId,
    discoveryId: snapshot.id,
    discoveryVersion: snapshot.discoveryVersion,
    timestamp,
  });
}

export function createBusinessContextService(
  repos: RepositoryContainer,
  eventBus: EventBus = new InMemoryEventBus(),
  auditSink: AuditSink = new InMemoryAuditSink(),
): BusinessContextService {
  const resolve = async (
    snapshot: BusinessContextSnapshot,
  ): Promise<ResolvedBusinessContext> => {
    const [constraints, capabilities] = await Promise.all([
      repos.businessConstraints.listByBusinessId(
        snapshot.orgId,
        snapshot.businessId,
      ),
      repos.businessCapabilities.listByBusinessId(
        snapshot.orgId,
        snapshot.businessId,
      ),
    ]);
    const byMaturity: Record<string, number> = {};
    for (const capability of capabilities) {
      byMaturity[capability.currentMaturity] =
        (byMaturity[capability.currentMaturity] ?? 0) + 1;
    }
    return Object.freeze({
      ...snapshot,
      activeGoals: Object.freeze(
        snapshot.context.goals.filter((goal) => goal.status === "active"),
      ),
      activeConstraints: Object.freeze(
        constraints
          .filter((constraint) => constraint.status === "active")
          .map((constraint) =>
            Object.freeze({
              id: constraint.id,
              title: constraint.title,
              priority: constraint.severity,
            }),
          ),
      ),
      capabilitySummary: Object.freeze({
        total: capabilities.length,
        byMaturity: Object.freeze(byMaturity),
      }),
    });
  };

  const publish = async (
    type: string,
    snapshot: BusinessContextSnapshot,
    execution: EventContext,
  ): Promise<void> => {
    const timestamp = new Date().toISOString();
    await eventBus.publish(
      createBossEvent(
        type,
        {
          ...eventPayload(snapshot, timestamp),
          correlationId: execution.correlationId,
          traceId: execution.traceId,
        },
        execution,
      ),
    );
  };

  const audit = (
    action: string,
    snapshot: BusinessContextSnapshot,
    execution: EventContext,
    reason: string,
  ): void | Promise<void> =>
    auditSink.record(
      createAuditEvent({
        traceId: execution.traceId,
        orgId: snapshot.orgId,
        actorId: execution.actorId,
        action,
        resourceType: "business_discovery",
        resourceId: snapshot.id,
        outcome: "success",
        metadata: {
          requestId: execution.requestId,
          correlationId: execution.correlationId,
          businessId: snapshot.businessId,
          discoveryVersion: snapshot.discoveryVersion,
          status: snapshot.status,
          reason,
        },
      }),
    );

  return {
    async create(orgId, businessId, context, execution) {
      assertTenant(orgId, execution);
      assertContextData(orgId, context, false);
      if (!(await repos.businesses.findById(orgId, businessId))) {
        throw new Error("The tenant-scoped business does not exist.");
      }
      const snapshot = await repos.businessDiscovery.create({
        orgId,
        businessId,
        context,
        schemaVersion: SCHEMA_VERSION,
        mutation: {
          actorId: execution.actorId,
          correlationId: execution.correlationId,
          traceId: execution.traceId,
          reason: "Business Discovery created.",
        },
      });
      await publish("business.discovery.created", snapshot, execution);
      await audit(
        "business.discovery.created",
        snapshot,
        execution,
        "Business Discovery created.",
      );
      return resolve(snapshot);
    },

    async update(orgId, businessId, context, mutation) {
      assertTenant(orgId, mutation.execution);
      assertContextData(orgId, context, false);
      const current = await repos.businessDiscovery.getCurrent(orgId, businessId);
      if (!current) {
        throw new Error("Business Discovery was not found.");
      }
      if (!["draft", "in_progress"].includes(current.status)) {
        throw new Error("Only draft or in-progress Business Context can be updated.");
      }
      const snapshot = await repos.businessDiscovery.saveContext({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        context,
        mutation: {
          actorId: mutation.execution.actorId,
          correlationId: mutation.execution.correlationId,
          traceId: mutation.execution.traceId,
          reason: mutation.reason,
        },
      });
      await publish("business.discovery.updated", snapshot, mutation.execution);
      await audit(
        "business.discovery.updated",
        snapshot,
        mutation.execution,
        mutation.reason,
      );
      return resolve(snapshot);
    },

    async transition(orgId, businessId, status, mutation) {
      assertTenant(orgId, mutation.execution);
      const current = await repos.businessDiscovery.getCurrent(orgId, businessId);
      if (!current) {
        throw new Error("Business Discovery was not found.");
      }
      const nextStatuses: readonly BusinessDiscoveryStatus[] =
        allowedTransitions[current.status];
      if (!nextStatuses.includes(status)) {
        throw new Error(
          `Business Discovery cannot transition from ${current.status} to ${status}.`,
        );
      }
      if (status === "validated") {
        assertContextData(orgId, current.context, true);
      }
      const snapshot = await repos.businessDiscovery.transition({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        status,
        mutation: {
          actorId: mutation.execution.actorId,
          correlationId: mutation.execution.correlationId,
          traceId: mutation.execution.traceId,
          reason: mutation.reason,
        },
      });
      if (status === "validated") {
        await publish(
          "business.discovery.validated",
          snapshot,
          mutation.execution,
        );
      }
      if (status === "published") {
        await publish(
          "business.context.published",
          snapshot,
          mutation.execution,
        );
      }
      await audit(
        "business.discovery.transitioned",
        snapshot,
        mutation.execution,
        mutation.reason,
      );
      return resolve(snapshot);
    },

    async getCurrent(orgId, businessId) {
      const snapshot = await repos.businessDiscovery.getCurrent(orgId, businessId);
      return snapshot ? resolve(snapshot) : null;
    },

    listVersions: (orgId, businessId) =>
      repos.businessDiscovery.listVersions(orgId, businessId),

    listHistory: (orgId, businessId) =>
      repos.businessDiscovery.listHistory(orgId, businessId),
  };
}
