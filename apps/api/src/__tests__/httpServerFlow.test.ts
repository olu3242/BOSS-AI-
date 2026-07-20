import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createHttpServer } from "../http/server.js";

const ORG_ID = "55555555-5555-5555-5555-555555555555";

describe("HTTP transport", () => {
  let server: Server;
  let baseUrl: string;
  let authHeader: Record<string, string>;

  beforeAll(async () => {
    process.env.SUPABASE_JWT_SECRET = "test-secret-do-not-use-in-production";
    const repos = createInMemoryContainer();
    const api = createApiFromContainer(repos);
    const app = createHttpServer(api);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (address && typeof address === "object") {
      baseUrl = `http://127.0.0.1:${address.port}`;
    }

    const tokenRes = await fetch(`${baseUrl}/api/v1/auth/dev-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId: ORG_ID }),
    });
    const { token } = (await tokenRes.json()) as { token: string };
    authHeader = { authorization: `Bearer ${token}` };
  });

  afterAll(() => {
    server.close();
  });

  it("rejects requests with no token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Acme" }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("missing_token");
  });

  it("returns 400 validation_error when request body is invalid", async () => {
    const res = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeader },
      body: JSON.stringify({ name: "" }), // name must be min(1), all other required fields missing
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("validation_error");
    expect(body.message).toMatch(/industry|employeeCount|name/);
  });

  it("returns 404 with the standard error envelope for an unknown route", async () => {
    const res = await fetch(`${baseUrl}/api/v1/nope`, { headers: authHeader });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code: string; traceId: string };
    expect(body.code).toBe("not_found");
    expect(body.traceId).toBeDefined();
  });

  it("creates a business and fetches it through the REST API", async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeader },
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
      headers: authHeader,
    });
    expect(getRes.status).toBe(200);
    const fetched = (await getRes.json()) as { businessId: string };
    expect(fetched.businessId).toBe(created.business.id);
  });

  it("runs the mission control snapshot route end to end", async () => {
    const createRes = await fetch(`${baseUrl}/api/v1/businesses`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeader },
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
      headers: authHeader,
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

  it("serves the authenticated organization dashboard contract", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard`, {
      headers: authHeader,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      businessCount: number;
      healthDistribution: Record<string, number>;
      topAlerts: unknown[];
      recentDecisions: unknown[];
      pendingApprovalsCount: number;
      revenueAtRisk: number;
    };
    expect(typeof body.businessCount).toBe("number");
    expect(body.healthDistribution).toEqual(
      expect.objectContaining({ excellent: 0, good: 0, needsAttention: 0, critical: 0 }),
    );
    expect(Array.isArray(body.topAlerts)).toBe(true);
    expect(Array.isArray(body.recentDecisions)).toBe(true);
    expect(typeof body.pendingApprovalsCount).toBe("number");
    expect(typeof body.revenueAtRisk).toBe("number");
  });
});
