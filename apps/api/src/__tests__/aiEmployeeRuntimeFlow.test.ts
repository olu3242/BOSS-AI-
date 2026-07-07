import { describe, expect, it } from "vitest";
import { aiEmployeeRegistry } from "@boss/registries";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";

const ORG_ID = "66666666-6666-6666-6666-666666666666";

describe("AI Employee runtime", () => {
  it("executes a capability through the Tool Fabric and records memory when the employee is available", async () => {
    aiEmployeeRegistry.register({
      key: "test_available_employee",
      label: "Test Available Employee",
      mission: "Send follow-up emails",
      responsibilities: ["Follow up with leads"],
      capabilities: ["send_email"],
      requiredTools: ["tool_send_email"],
      kpis: ["response_rate"],
      permissions: [],
      escalationRules: [],
      lifecycle: "available",
      readModels: [],
      writeModels: [],
      allowedActions: ["send_communication"],
      decisionAuthority: "execute",
      promptTemplateKey: "test.follow-up",
      memory: { shortTermTtlMinutes: 30, longTermEnabled: false, contextKeys: [] },
      businessObjectives: [],
      lifecycleStages: [],
    });

    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const toolFabric = createToolFabricService(repos);
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Bright Smile Dental",
      industry: "dental",
      employeeCount: 10,
      annualRevenue: 900000,
      businessType: "dental",
      yearsOperating: 6,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
    });

    await toolFabric.connectIntegration(ORG_ID, business.id, "smtp");
    await toolFabric.setPermission(ORG_ID, business.id, {
      toolKey: "tool_send_email",
      roleKey: "test_available_employee",
      allowed: true,
      approval: "auto",
      rateLimitPerMinute: null,
    });

    const events: string[] = [];
    repos.eventBus.subscribe("ai_employee.task.completed", (event) => events.push(event.type));
    repos.eventBus.subscribe("ai_employee.task.failed", (event) => events.push(event.type));
    repos.eventBus.subscribe("ai_employee.escalation.triggered", (event) => events.push(event.type));

    const execution = await loopRuntime.execute(ORG_ID, business.id, "ai_employee_test", [
      {
        stepKey: "send_followup",
        taskType: "ai",
        input: {
          orgId: ORG_ID,
          businessId: business.id,
          employeeKey: "test_available_employee",
          capabilityKey: "send_email",
          requestedBy: "test_available_employee",
          to: "customer@example.com",
          subject: "Following up",
          body: "Just checking in!",
        },
      },
    ]);

    expect(execution.state).toBe("completed");
    expect(events).toContain("ai_employee.task.completed");

    const memory = await repos.memoryRecords.get(
      ORG_ID,
      business.id,
      "agent",
      "test_available_employee",
      "last_execution:send_email"
    );
    expect(memory).not.toBeNull();
  });

  it("escalates instead of executing when the employee lacks the requested capability", async () => {
    aiEmployeeRegistry.register({
      key: "test_limited_employee",
      label: "Test Limited Employee",
      mission: "Answer phones",
      responsibilities: ["Answer inbound calls"],
      capabilities: ["answer_call"],
      requiredTools: [],
      kpis: [],
      permissions: [],
      escalationRules: [],
      lifecycle: "available",
      readModels: [],
      writeModels: [],
      allowedActions: [],
      decisionAuthority: "none",
      promptTemplateKey: "test.phone",
      memory: { shortTermTtlMinutes: 15, longTermEnabled: false, contextKeys: [] },
      businessObjectives: [],
      lifecycleStages: [],
    });

    const repos = createInMemoryContainer();
    const profileService = createBusinessProfileService(repos);
    const toolFabric = createToolFabricService(repos);
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);

    const { business } = await profileService.createBusiness({
      orgId: ORG_ID,
      name: "Bright Smile Dental",
      industry: "dental",
      employeeCount: 10,
      annualRevenue: 900000,
      businessType: "dental",
      yearsOperating: 6,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
    });

    const events: string[] = [];
    repos.eventBus.subscribe("ai_employee.escalation.triggered", (event) => events.push(event.type));

    const execution = await loopRuntime.execute(ORG_ID, business.id, "ai_employee_test_escalation", [
      {
        stepKey: "send_followup",
        taskType: "ai",
        input: {
          orgId: ORG_ID,
          businessId: business.id,
          employeeKey: "test_limited_employee",
          capabilityKey: "send_email",
          requestedBy: "test_limited_employee",
        },
      },
    ]);

    expect(execution.state).toBe("failed");
    expect(events).toContain("ai_employee.escalation.triggered");
  });
});
