import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiEmployeeRegistry, promptRegistry } from "@boss/registries";
import { createInMemoryContainer } from "../container.js";
import { createAiEmployeeExecutionService } from "../services/aiEmployeeExecutionService.js";

const ORG = "org-exec-test";
const BIZ = "biz-exec-test";

const EMPLOYEE = {
  key: "exec_test_employee",
  label: "Test Exec Employee",
  mission: "Handle follow-up tasks",
  responsibilities: ["send follow-ups"],
  capabilities: ["send_followup"],
  requiredTools: [],
  kpis: [],
  permissions: [],
  escalationRules: [],
  lifecycle: "available" as const,
  readModels: [],
  writeModels: [],
  allowedActions: ["send_communication"],
  decisionAuthority: "execute" as const,
  promptTemplateKey: "exec_test.system",
  memory: { shortTermTtlMinutes: 30, longTermEnabled: false, contextKeys: [] },
  businessObjectives: [],
  lifecycleStages: [],
};

const EMPLOYEE_LOW_CONF = {
  ...EMPLOYEE,
  key: "exec_test_low_conf",
  escalationRules: ["low_confidence: escalate when confidence is too low"],
};

// Register once — registry throws on duplicates
if (!aiEmployeeRegistry.get(EMPLOYEE.key)) aiEmployeeRegistry.register(EMPLOYEE);
if (!aiEmployeeRegistry.get(EMPLOYEE_LOW_CONF.key)) aiEmployeeRegistry.register(EMPLOYEE_LOW_CONF);
if (!promptRegistry.get("exec_test.system")) promptRegistry.register({ key: "exec_test.system", label: "Test system prompt", role: "system", template: "You are a test employee." });

describe("AiEmployeeExecutionService", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back gracefully when ANTHROPIC_API_KEY is absent", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);

    const result = await svc.execute({
      orgId: ORG,
      businessId: BIZ,
      employeeKey: "exec_test_employee",
      capabilityKey: "send_followup",
      requestedBy: "test",
      taskInput: { to: "lead@example.com" },
    });

    expect(result.reasoning).toContain("Inference skipped");
    expect(result.confidence).toBe("low");
    expect(result.escalated).toBe(false);
  });

  it("persists execution memory after running", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);

    await svc.execute({
      orgId: ORG,
      businessId: BIZ,
      employeeKey: "exec_test_employee",
      capabilityKey: "send_followup",
      requestedBy: "test",
      taskInput: { to: "lead@example.com" },
    });

    const mem = await repos.memoryRecords.get(ORG, BIZ, "agent", "exec_test_employee", "last_execution:send_followup");
    expect(mem).not.toBeNull();
    expect((mem!.value as Record<string, unknown>).confidence).toBe("low");
  });

  it("emits ai_employee.inference.completed event", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);
    const emitted: string[] = [];
    repos.eventBus.subscribe("ai_employee.inference.completed", (e) => emitted.push(e.type));

    await svc.execute({
      orgId: ORG,
      businessId: BIZ,
      employeeKey: "exec_test_employee",
      capabilityKey: "send_followup",
      requestedBy: "test",
      taskInput: { to: "lead@example.com" },
    });

    expect(emitted).toContain("ai_employee.inference.completed");
  });

  it("escalates and emits escalation event when low_confidence rule matches", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);
    const emitted: string[] = [];
    repos.eventBus.subscribe("ai_employee.task.escalated", (e) => emitted.push(e.type));

    const result = await svc.execute({
      orgId: ORG,
      businessId: BIZ,
      employeeKey: "exec_test_low_conf",
      capabilityKey: "send_followup",
      requestedBy: "test",
      taskInput: { to: "lead@example.com" },
    });

    expect(result.escalated).toBe(true);
    expect(result.escalationReason).toContain("low");
    expect(emitted).toContain("ai_employee.task.escalated");
  });

  it("throws when employee key is unknown", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);

    await expect(
      svc.execute({
        orgId: ORG,
        businessId: BIZ,
        employeeKey: "no_such_employee",
        capabilityKey: "anything",
        requestedBy: "test",
        taskInput: {},
      }),
    ).rejects.toThrow("Unknown AI employee");
  });

  it("getMemoryContext returns empty object when no records exist", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);
    const ctx = await svc.getMemoryContext(ORG, BIZ, "exec_test_employee");
    expect(ctx).toEqual({});
  });

  it("getMemoryContext returns lastExecution when generic key is stored", async () => {
    const repos = createInMemoryContainer();
    const svc = createAiEmployeeExecutionService(repos);

    // Manually store the generic key that getMemoryContext reads
    await repos.memoryRecords.upsert({
      orgId: ORG,
      businessId: BIZ,
      ownerType: "agent",
      ownerId: "exec_test_employee",
      key: "last_execution:exec_test_employee",
      value: { reasoning: "did something", confidence: "high" },
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const ctx = await svc.getMemoryContext(ORG, BIZ, "exec_test_employee");
    expect(ctx.lastExecution).toBeDefined();
  });
});
