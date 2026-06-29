import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createHttpServer } from "../http/server.js";

const ORG_ID = "55555555-5555-5555-5555-555555555555";

describe("HTTP transport", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const repos = createInMemoryContainer();
    const api = createApiFromContainer(repos);
    const app = createHttpServer(api);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (address && typeof address === "object") {
      baseUrl = `http://127.0.0.1:${address.port}`;
    }
  });

  afterAll(() => {
    server.close();
  });

  it("rejects requests with no org id", async () => {
    const res = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Acme" }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("missing_org_id");
  });

  it("returns 404 with the standard error envelope for an unknown route", async () => {
    const res = await fetch(`${baseUrl}/api/v1/nope`, { headers: { "x-org-id": ORG_ID } });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code: string; traceId: string };
    expect(body.code).toBe("not_found");
    expect(body.traceId).toBeDefined();
  });

  it("creates a business and fetches it through the REST API", async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-org-id": ORG_ID },
      body: JSON.stringify({
        name: "Acme Pest Control",
        industry: "pest_control",
        employeeCount: 8,
        annualRevenue: 500000,
        businessType: "pest_control",
        yearsOperating: 4,
        locationCount: 1,
        businessHours: "Mon-Fri 8am-5pm",
      }),
    });
    expect(createRes.status).toBe(200);
    const created = (await createRes.json()) as { business: { id: string; name: string } };
    expect(created.business.name).toBe("Acme Pest Control");

    const getRes = await fetch(`${baseUrl}/api/v1/businesses/${created.business.id}`, {
      headers: { "x-org-id": ORG_ID },
    });
    expect(getRes.status).toBe(200);
    const fetched = (await getRes.json()) as { businessId: string };
    expect(fetched.businessId).toBe(created.business.id);
  });

  it("runs the mission control snapshot route end to end", async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-org-id": ORG_ID },
      body: JSON.stringify({
        name: "Acme MC",
        industry: "pest_control",
        employeeCount: 8,
        annualRevenue: 500000,
        businessType: "pest_control",
        yearsOperating: 4,
        locationCount: 1,
        businessHours: "Mon-Fri 8am-5pm",
      }),
    });
    const created = (await createRes.json()) as { business: { id: string } };

    const snapshotRes = await fetch(`${baseUrl}/api/v1/businesses/${created.business.id}/mission-control`, {
      headers: { "x-org-id": ORG_ID },
    });
    expect(snapshotRes.status).toBe(200);
    const snapshot = (await snapshotRes.json()) as {
      workflows: unknown[];
      deadLetters: unknown[];
      timeline: Array<{ type: string }>;
    };
    expect(snapshot.workflows).toEqual([]);
    expect(snapshot.deadLetters).toEqual([]);
    expect(snapshot.timeline.map((t: { type: string }) => t.type)).toContain("business_created");
  });
});
