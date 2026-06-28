import { createInMemoryOrganizationRepository } from "@boss/db";
import {
  InMemoryEventBus,
  type BossEvent,
} from "@boss/events";
import { describe, expect, it } from "vitest";
import {
  OrganizationRuntime,
  RepositoryMembershipStore,
} from "../organization.js";
import { InMemoryAuditSink } from "../observability.js";

const context = {
  actorId: "user-1",
  requestId: "request-1",
  correlationId: "correlation-1",
  traceId: "trace-1",
} as const;

describe("OrganizationRuntime", () => {
  it("creates an owner membership and restores the active tenant", async () => {
    const repository = createInMemoryOrganizationRepository();
    const events: BossEvent[] = [];
    const eventBus = new InMemoryEventBus();
    const audit = new InMemoryAuditSink();
    eventBus.subscribe("*", (event) => {
      events.push(event);
    });
    const organizations = new OrganizationRuntime(repository, eventBus, audit);

    const first = await organizations.create("user-1", "Northwind", context);
    const second = await organizations.create("user-1", "Contoso", context);

    expect(first.membership.role).toBe("owner");
    expect(await organizations.list("user-1")).toHaveLength(2);
    expect(await organizations.active("user-1")).toEqual(second.organization);
    expect(events.map((event) => event.type)).toEqual([
      "organization.created",
      "organization.created",
    ]);
    expect(events[0]?.context).toEqual(
      expect.objectContaining({
        actorId: "user-1",
        orgId: first.organization.id,
        traceId: "trace-1",
      }),
    );
    expect(audit.list(first.organization.id)).toEqual([
      expect.objectContaining({
        action: "organization.created",
        outcome: "success",
        traceId: "trace-1",
      }),
    ]);
  });

  it("switches only to organizations where the user is a member", async () => {
    const repository = createInMemoryOrganizationRepository();
    const audit = new InMemoryAuditSink();
    const organizations = new OrganizationRuntime(
      repository,
      new InMemoryEventBus(),
      audit,
    );
    const own = await organizations.create("user-1", "Northwind", context);
    const other = await organizations.create("user-2", "Tailspin", {
      ...context,
      actorId: "user-2",
    });

    await organizations.switch(
      "user-1",
      own.organization.id,
      context,
    );
    expect(await organizations.active("user-1")).toEqual(own.organization);
    await expect(
      organizations.switch("user-1", other.organization.id, context),
    ).rejects.toThrow("not an active member");
    expect(audit.list(other.organization.id)).toEqual([
      expect.objectContaining({
        action: "organization.created",
        outcome: "success",
      }),
      expect.objectContaining({
        action: "organization.switched",
        outcome: "denied",
      }),
    ]);
  });

  it("exposes repository memberships to the authorization runtime", async () => {
    const repository = createInMemoryOrganizationRepository();
    const organizations = new OrganizationRuntime(repository);
    const memberships = new RepositoryMembershipStore(repository);
    const created = await organizations.create("user-1", "Northwind", context);

    await expect(
      memberships.get("user-1", created.organization.id),
    ).resolves.toEqual(
      expect.objectContaining({
        role: "owner",
        status: "active",
      }),
    );
    await expect(
      memberships.get("user-2", created.organization.id),
    ).resolves.toBeUndefined();
  });
});
