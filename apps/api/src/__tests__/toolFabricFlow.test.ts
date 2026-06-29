import { describe, expect, it } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createToolFabricService } from "../services/toolFabricService.js";

const ORG_ID = "44444444-4444-4444-4444-444444444444";

describe("tool fabric flow", () => {
  it("connects an integration, resolves a capability, executes it, and records audit/health", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const toolFabric = createToolFabricService(repos);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Riverside Plumbing",
      industry: "plumbing",
      employeeCount: 6,
      annualRevenue: 410000,
      businessType: "plumbing",
      yearsOperating: 3,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
    });

    await toolFabric.connectIntegration(ORG_ID, business.id, "gmail");
    const integrations = await toolFabric.listIntegrations(ORG_ID, business.id);
    expect(integrations.map((i) => i.providerKey)).toContain("gmail");

    await toolFabric.setPermission(ORG_ID, business.id, {
      toolKey: "tool_send_email",
      roleKey: "ai_follow_up_assistant",
      allowed: true,
      approval: "auto",
      rateLimitPerMinute: null,
    });

    const execution = await toolFabric.requestTool(ORG_ID, business.id, {
      capabilityKey: "send_email",
      roleKey: "ai_follow_up_assistant",
      requestedBy: "ai_follow_up_assistant",
      input: { to: "customer@example.com", subject: "Following up", body: "Just checking in!" },
    });

    expect(execution.status).toBe("succeeded");
    expect(execution.providerKey).toBe("gmail");
    expect(execution.toolKey).toBe("tool_send_email");
    expect(execution.output).not.toBeNull();

    const executions = await toolFabric.listExecutions(ORG_ID, business.id);
    expect(executions.length).toBe(1);

    const audit = await toolFabric.listAuditHistory(ORG_ID, business.id);
    expect(audit.length).toBeGreaterThanOrEqual(2);
    expect(audit.map((a) => a.action)).toContain("tool.requested");
    expect(audit.map((a) => a.action)).toContain("tool.succeeded");

    const health = await toolFabric.listProviderHealth(ORG_ID, business.id);
    expect(health.length).toBe(1);
    expect(health[0]?.status).toBe("healthy");
  });

  it("rejects a tool request when no provider for the capability is connected", async () => {
    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const toolFabric = createToolFabricService(repos);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Northside Landscaping",
      industry: "landscaping",
      employeeCount: 5,
      annualRevenue: 300000,
      businessType: "landscaping",
      yearsOperating: 2,
      locationCount: 1,
      businessHours: "Mon-Fri 7am-4pm",
    });

    await expect(
      toolFabric.requestTool(ORG_ID, business.id, {
        capabilityKey: "send_email",
        roleKey: "ai_follow_up_assistant",
        requestedBy: "ai_follow_up_assistant",
        input: { to: "customer@example.com", subject: "Hi", body: "Hello" },
      })
    ).rejects.toThrow();
  });
});
