import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryContainer } from "../container.js";
import { createApiFromContainer } from "../index.js";
import { createHttpServer } from "../http/server.js";

describe("Observability — health endpoint", () => {
  let server: Server;
  let baseUrl: string;

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
  });

  afterAll(() => server.close());

  it("GET /health returns 200 with status:ok and a metric snapshot", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      uptimeMs: number;
      memoryMb: { rss: number };
      counters: { httpRequests: number };
    };
    expect(body.status).toBe("ok");
    expect(body.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(body.memoryMb.rss).toBeGreaterThan(0);
    expect(typeof body.counters.httpRequests).toBe("number");
  });

  it("GET /health requires no authentication", async () => {
    // No Authorization header — must succeed (health is unauthenticated)
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
  });

  it("response includes x-trace-id header", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get("x-trace-id")).toBeTruthy();
  });

  it("GET /api/v1/metrics returns metric snapshot when authenticated", async () => {
    const tokenRes = await fetch(`${baseUrl}/api/v1/auth/dev-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId: "org-obs-test" }),
    });
    const { token } = (await tokenRes.json()) as { token: string };

    const metricsRes = await fetch(`${baseUrl}/api/v1/metrics`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(metricsRes.status).toBe(200);
    const snap = (await metricsRes.json()) as {
      capturedAt: string;
      counters: { httpRequests: number; workflowsExecuted: number };
      latency: { httpRequestsP50Ms: number };
    };
    expect(snap.capturedAt).toBeTruthy();
    expect(typeof snap.counters.httpRequests).toBe("number");
    expect(typeof snap.counters.workflowsExecuted).toBe("number");
    expect(typeof snap.latency.httpRequestsP50Ms).toBe("number");
  });

  it("httpRequests counter increments across requests", async () => {
    const snap1 = (await (await fetch(`${baseUrl}/health`)).json()) as { counters: { httpRequests: number } };
    await fetch(`${baseUrl}/health`);
    const snap2 = (await (await fetch(`${baseUrl}/health`)).json()) as { counters: { httpRequests: number } };
    expect(snap2.counters.httpRequests).toBeGreaterThan(snap1.counters.httpRequests);
  });
});
