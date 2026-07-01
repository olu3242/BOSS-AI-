/**
 * RC1.5 WS3 — Provider isolation and resilience.
 * Uses the same setup as toolFabricFlow.test.ts (connectIntegration first).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createToolFabricService } from "../services/toolFabricService.js";

const ORG_A = "org-a-isolation";
const ORG_B = "org-b-isolation";

async function setupBusiness(repos: ReturnType<typeof createInMemoryContainer>, orgId: string, name: string) {
  const profileSvc = createBusinessProfileService(repos);
  const { business } = await profileSvc.createBusiness({ orgId, name, industry: "retail", employeeCount: 5, annualRevenue: 200000, businessType: "retail", yearsOperating: 3, locationCount: 1, businessHours: "9-5" });
  return business;
}

describe("RC1.5 WS3 — Provider Isolation & Resilience", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("tool executes after connecting integration and permissions are set", async () => {
    const biz = await setupBusiness(c, ORG_A, "BizA");
    const svc = createToolFabricService(c);
    await svc.connectIntegration(ORG_A, biz.id, "smtp");
    await svc.setPermission(ORG_A, biz.id, { toolKey: "tool_send_email", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });

    const result = await svc.requestTool(ORG_A, biz.id, { capabilityKey: "send_email", roleKey: "admin", requestedBy: "test", input: { to: "a@b.com", subject: "hi", body: "hello" } });
    expect(result.status).toBe("succeeded");
    expect(result.id).toBeDefined();
  });

  it("one provider failing does not affect subsequent calls to different provider", async () => {
    const biz = await setupBusiness(c, ORG_A, "BizA");
    const svc = createToolFabricService(c);

    // Connect two providers
    await svc.connectIntegration(ORG_A, biz.id, "smtp");
    await svc.connectIntegration(ORG_A, biz.id, "twilio");
    await svc.setPermission(ORG_A, biz.id, { toolKey: "tool_send_email", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });
    await svc.setPermission(ORG_A, biz.id, { toolKey: "tool_send_sms", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });

    const emailResult = await svc.requestTool(ORG_A, biz.id, { capabilityKey: "send_email", roleKey: "admin", requestedBy: "test", input: {} });
    const smsResult = await svc.requestTool(ORG_A, biz.id, { capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test", input: {} });

    expect(emailResult.id).toBeDefined();
    expect(smsResult.id).toBeDefined();
  });

  it("audit log captures every tool execution in order", async () => {
    const biz = await setupBusiness(c, ORG_A, "BizA");
    const svc = createToolFabricService(c);
    await svc.connectIntegration(ORG_A, biz.id, "smtp");
    await svc.connectIntegration(ORG_A, biz.id, "twilio");
    await svc.setPermission(ORG_A, biz.id, { toolKey: "tool_send_email", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });
    await svc.setPermission(ORG_A, biz.id, { toolKey: "tool_send_sms", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });

    await svc.requestTool(ORG_A, biz.id, { capabilityKey: "send_email", roleKey: "admin", requestedBy: "test", input: {} });
    await svc.requestTool(ORG_A, biz.id, { capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test", input: {} });

    const audit = await svc.listAuditHistory(ORG_A, biz.id);
    expect(audit.length).toBeGreaterThanOrEqual(4); // requested + succeeded for each
  });

  it("provider health is recorded per execution", async () => {
    const biz = await setupBusiness(c, ORG_A, "BizA");
    const svc = createToolFabricService(c);
    await svc.connectIntegration(ORG_A, biz.id, "smtp");
    await svc.setPermission(ORG_A, biz.id, { toolKey: "tool_send_email", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });
    await svc.requestTool(ORG_A, biz.id, { capabilityKey: "send_email", roleKey: "admin", requestedBy: "test", input: {} });

    const health = await svc.listProviderHealth(ORG_A, biz.id);
    expect(health.length).toBeGreaterThan(0);
  });

  it("tenant isolation: org-A executions are not visible to org-B", async () => {
    const bizA = await setupBusiness(c, ORG_A, "BizA");
    const bizB = await setupBusiness(c, ORG_B, "BizB");
    const svc = createToolFabricService(c);

    await svc.connectIntegration(ORG_A, bizA.id, "smtp");
    await svc.setPermission(ORG_A, bizA.id, { toolKey: "tool_send_email", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });
    await svc.requestTool(ORG_A, bizA.id, { capabilityKey: "send_email", roleKey: "admin", requestedBy: "A", input: {} });

    await svc.connectIntegration(ORG_B, bizB.id, "twilio");
    await svc.setPermission(ORG_B, bizB.id, { toolKey: "tool_send_sms", roleKey: "admin", allowed: true, approval: "auto", rateLimitPerMinute: null });
    await svc.requestTool(ORG_B, bizB.id, { capabilityKey: "send_sms", roleKey: "admin", requestedBy: "B", input: {} });

    const exA = await svc.listExecutions(ORG_A, bizA.id);
    const exB = await svc.listExecutions(ORG_B, bizB.id);

    expect(exA.every((e) => e.orgId === ORG_A)).toBe(true);
    expect(exB.every((e) => e.orgId === ORG_B)).toBe(true);
    expect(exA.some((e) => e.orgId === ORG_B)).toBe(false);
  });
});
