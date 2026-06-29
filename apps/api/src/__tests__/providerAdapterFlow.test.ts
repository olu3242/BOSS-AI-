import { describe, expect, it, vi } from "vitest";
import { createTwilioSmsAdapter } from "../services/providerAdapters/twilioSmsAdapter.js";
import { createCircuitBreaker } from "../services/providerAdapters/circuitBreaker.js";
import { withRetry } from "../services/providerAdapters/retryPolicy.js";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import type { ResolvedTool } from "@boss/mcp";

const ORG_ID = "55555555-5555-5555-5555-555555555555";

const mockResolved: ResolvedTool = {
  toolKey: "tool_send_sms",
  capabilityKey: "send_sms",
  providerKey: "twilio",
  requiredPermissions: [],
  approval: "auto",
};

const mockCredential = { secretRef: "TWILIO_CREDENTIALS", value: "ACtest123:authtoken456" };

describe("TwilioSmsAdapter", () => {
  it("returns succeeded when Twilio API returns 201", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ sid: "SMxxx", status: "queued" }),
    } as unknown as Response);

    const adapter = createTwilioSmsAdapter(mockFetch);
    const result = await adapter.execute(mockResolved, { to: "+1234567890", from: "+0987654321", body: "Hello" }, mockCredential);

    expect(result.status).toBe("succeeded");
    expect(result.errorMessage).toBeNull();
    expect(result.output).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toContain("ACtest123");
    expect(String(init.body)).toContain("To=%2B1234567890");
  });

  it("returns failed when Twilio API returns 400", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ code: 21211, message: "The 'To' number is not a valid phone number" }),
    } as unknown as Response);

    const adapter = createTwilioSmsAdapter(mockFetch);
    const result = await adapter.execute(mockResolved, { to: "invalid", from: "+0987654321", body: "Hi" }, mockCredential);

    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("400");
  });

  it("returns failed when credential format is wrong", async () => {
    const mockFetch = vi.fn();
    const adapter = createTwilioSmsAdapter(mockFetch);
    const result = await adapter.execute(mockResolved, {}, { secretRef: "X", value: "badformat" });

    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("accountSid");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns failed and measures latency when fetch throws a network error", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const adapter = createTwilioSmsAdapter(mockFetch);
    const result = await adapter.execute(mockResolved, { to: "+1", from: "+2", body: "Hi" }, mockCredential);

    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("ECONNREFUSED");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe("CircuitBreaker", () => {
  it("opens after failureThreshold consecutive failures", () => {
    const cb = createCircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60_000 });
    expect(cb.canAttempt("twilio")).toBe(true);
    const r1 = cb.recordFailure("twilio");
    expect(r1.openedNow).toBe(false);
    const r2 = cb.recordFailure("twilio");
    expect(r2.openedNow).toBe(true);
    expect(cb.canAttempt("twilio")).toBe(false);
  });

  it("closes again after a success", () => {
    const cb = createCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60_000 });
    cb.recordFailure("twilio");
    expect(cb.canAttempt("twilio")).toBe(false);
    cb.recordSuccess("twilio");
    expect(cb.canAttempt("twilio")).toBe(true);
  });

  it("transitions to half_open after resetTimeout", async () => {
    const cb = createCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1 });
    cb.recordFailure("twilio");
    await new Promise((r) => setTimeout(r, 5));
    expect(cb.canAttempt("twilio")).toBe(true);
  });
});

describe("retryPolicy", () => {
  it("retries on failure up to maxAttempts", async () => {
    let calls = 0;
    const { result, attemptCount } = await withRetry(
      { maxAttempts: 3, baseDelayMs: 1 },
      async () => {
        calls++;
        return calls < 3 ? { status: "failed" } : { status: "succeeded" };
      },
      (r) => r.status === "failed"
    );
    expect(result.status).toBe("succeeded");
    expect(attemptCount).toBe(3);
    expect(calls).toBe(3);
  });
});

describe("toolFabricService with Twilio adapter (missing credential falls back to failure)", () => {
  it("execution fails gracefully when twilio has no credential reference", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const toolFabric = createToolFabricService(repos);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "SMS Test Co",
      industry: "retail",
      employeeCount: 3,
      annualRevenue: 100000,
      businessType: "retail",
      yearsOperating: 1,
      locationCount: 1,
      businessHours: "Mon-Fri 9am-5pm",
    });

    await toolFabric.connectIntegration(ORG_ID, business.id, "twilio");
    await toolFabric.setPermission(ORG_ID, business.id, {
      toolKey: "tool_send_sms",
      roleKey: "ai_follow_up_assistant",
      allowed: true,
      approval: "auto",
      rateLimitPerMinute: null,
    });

    const execution = await toolFabric.requestTool(ORG_ID, business.id, {
      capabilityKey: "send_sms",
      roleKey: "ai_follow_up_assistant",
      requestedBy: "ai_follow_up_assistant",
      input: { to: "+1234567890", from: "+0987654321", body: "Hello from BOSS" },
    });

    expect(execution.status).toBe("failed");
    expect(execution.errorMessage).toContain("credential");
  });
});
