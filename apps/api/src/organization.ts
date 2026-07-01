import { randomUUID } from "node:crypto";
import {
  createInMemoryOrganizationRepository,
  createPostgresOrganizationRepository,
  type OrganizationRepository,
} from "@boss/db";
import { createBossEvent, InMemoryEventBus, type EventBus } from "@boss/events";
import type {
  Organization,
  OrganizationWithMembership,
} from "@boss/types";
import type {
  MembershipStore,
  OrganizationMembership,
} from "./identity.js";
import {
  createAuditEvent,
  PostgresAuditSink,
  type AuditSink,
} from "./observability.js";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "organization"}-${randomUUID().slice(0, 8)}`;
}

export interface OrganizationEventContext {
  readonly actorId: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly traceId: string;
}

export class OrganizationRuntime {
  constructor(
    private readonly repository: OrganizationRepository,
    private readonly eventBus: EventBus = new InMemoryEventBus(),
    private readonly auditSink?: AuditSink,
  ) {}

  async create(
    userId: string,
    name: string,
    context: OrganizationEventContext,
  ): Promise<OrganizationWithMembership> {
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      throw new Error("Organization name must be between 2 and 100 characters.");
    }
    let created: OrganizationWithMembership;
    try {
      created = await this.repository.create(userId, {
        name: normalizedName,
        slug: slugify(normalizedName),
      });
      await this.eventBus.publish(
        createBossEvent(
          "organization.created",
          {
            organizationId: created.organization.id,
            name: created.organization.name,
          },
          {
            orgId: created.organization.id,
            actorId: context.actorId,
            requestId: context.requestId,
            correlationId: context.correlationId,
            traceId: context.traceId,
          },
        ),
      );
    } catch (error) {
      await this.recordAudit(
        "organization.created",
        "platform",
        null,
        "failure",
        context,
      );
      throw error;
    }
    await this.auditSink?.record(
      createAuditEvent({
        traceId: context.traceId,
        orgId: created.organization.id,
        actorId: context.actorId,
        action: "organization.created",
        resourceType: "organization",
        resourceId: created.organization.id,
        outcome: "success",
        metadata: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
      }),
    );
    return created;
  }

  list(userId: string): Promise<readonly OrganizationWithMembership[]> {
    return this.repository.listForUser(userId);
  }

  active(userId: string): Promise<Organization | null> {
    return this.repository.getActive(userId);
  }

  async switch(
    userId: string,
    orgId: string,
    context: OrganizationEventContext,
  ): Promise<Organization> {
    let organization: Organization;
    try {
      organization = await this.repository.setActive(userId, orgId);
      await this.eventBus.publish(
        createBossEvent(
          "organization.switched",
          { organizationId: organization.id },
          {
            orgId: organization.id,
            actorId: context.actorId,
            requestId: context.requestId,
            correlationId: context.correlationId,
            traceId: context.traceId,
          },
        ),
      );
    } catch (error) {
      await this.recordAudit(
        "organization.switched",
        orgId,
        orgId,
        "denied",
        context,
      );
      throw error;
    }
    await this.recordAudit(
      "organization.switched",
      organization.id,
      organization.id,
      "success",
      context,
    );
    return organization;
  }

  private recordAudit(
    action: string,
    orgId: string,
    resourceId: string | null,
    outcome: "success" | "failure" | "denied",
    context: OrganizationEventContext,
  ): void | Promise<void> | undefined {
    return this.auditSink?.record(
      createAuditEvent({
        traceId: context.traceId,
        orgId,
        actorId: context.actorId,
        action,
        resourceType: "organization",
        resourceId,
        outcome,
        metadata: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
      }),
    );
  }
}

export class RepositoryMembershipStore implements MembershipStore {
  constructor(private readonly repository: OrganizationRepository) {}

  async get(
    userId: string,
    orgId: string,
  ): Promise<OrganizationMembership | undefined> {
    return this.repository.getMembership(userId, orgId);
  }

  async list(userId: string): Promise<readonly OrganizationMembership[]> {
    return (await this.repository.listForUser(userId)).map(
      (entry) => entry.membership,
    );
  }

  async save(membership: OrganizationMembership): Promise<void> {
    const existing = await this.repository.getMembership(
      membership.userId,
      membership.orgId,
    );
    if (!existing) {
      throw new Error(
        "Membership creation is owned by organization onboarding and invitations.",
      );
    }
  }
}

export function createPostgresOrganizationRuntime(): {
  readonly organizations: OrganizationRuntime;
  readonly memberships: MembershipStore;
} {
  const repository = createPostgresOrganizationRepository();
  return {
    organizations: new OrganizationRuntime(
      repository,
      new InMemoryEventBus(),
      new PostgresAuditSink(),
    ),
    memberships: new RepositoryMembershipStore(repository),
  };
}

export function createInMemoryOrganizationRuntime(): {
  readonly organizations: OrganizationRuntime;
  readonly memberships: MembershipStore;
} {
  const repository = createInMemoryOrganizationRepository();
  return {
    organizations: new OrganizationRuntime(repository),
    memberships: new RepositoryMembershipStore(repository),
  };
}
