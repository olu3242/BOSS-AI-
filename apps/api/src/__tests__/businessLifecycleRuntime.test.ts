import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@boss/events";
import {
  AgentRuntime,
  BossRuntime,
  InMemoryAgentMemoryStore,
  InMemoryQueueRuntime,
  InMemoryRuntimeTelemetry,
  InMemorySchedulerRuntime,
  InMemoryWorkflowExecutionStore,
  WorkflowRuntime,
  type AgentModel,
} from "@boss/loop";
import {
  AuthenticationError,
  IdentityRuntime,
  InMemoryMembershipStore,
  type IdentityProvider,
  type ProviderSession,
  type SignUpResult,
} from "../identity.js";
import { createInMemoryApi } from "../index.js";
import { InMemoryAuditSink } from "../observability.js";

class JourneyIdentityProvider implements IdentityProvider {
  private session: ProviderSession | undefined;

  async signUp(email: string, _password: string): Promise<SignUpResult> {
    this.session = {
      identity: {
        userId: "user-owner",
        email,
        emailVerified: true,
      },
      accessToken: "journey-access",
      refreshToken: "journey-refresh",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    return {
      identity: this.session.identity,
      session: this.session,
      verificationRequired: false,
    };
  }

  async signIn(): Promise<ProviderSession> {
    if (!this.session) {
      throw new AuthenticationError("Not registered.");
    }
    return this.session;
  }

  async verify(accessToken: string): Promise<ProviderSession> {
    if (!this.session || this.session.accessToken !== accessToken) {
      throw new AuthenticationError("Session is invalid.");
    }
    return this.session;
  }

  async refresh(): Promise<ProviderSession> {
    if (!this.session) {
      throw new AuthenticationError("Session is invalid.");
    }
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = undefined;
  }

  async requestPasswordReset(): Promise<void> {}

  async updatePassword(): Promise<void> {}
}

describe("business lifecycle runtime certification", () => {
  it("executes visitor-to-insight-to-logout with tenant context", async () => {
    const orgId = "11111111-1111-1111-1111-111111111111";
    const identityProvider = new JourneyIdentityProvider();
    const memberships = new InMemoryMembershipStore();
    const audit = new InMemoryAuditSink();
    const identity = new IdentityRuntime(
      identityProvider,
      memberships,
      audit,
    );

    const signup = await identity.signUp(
      "owner@example.com",
      "provider-managed-password",
    );
    expect(signup.verificationRequired).toBe(false);
    expect(signup.session).not.toBeNull();
    await memberships.save({
      userId: signup.identity.userId,
      orgId,
      role: "owner",
      status: "active",
    });
    const authorization = await identity.authorize({
      accessToken: signup.session!.accessToken,
      orgId,
      action: "business:create",
      requestId: "request-journey",
      traceId: "trace-journey",
    });

    const api = createInMemoryApi();
    const { business } = await api.business.create({
      orgId,
      name: "Runtime Certified Services",
      industry: "professional_services",
      employeeCount: 5,
      annualRevenue: 500000,
      businessType: "consulting",
      yearsOperating: 3,
      locationCount: 1,
      businessHours: "Mon-Fri 8am-5pm",
    });
    const mri = await api.businessMri.start(orgId, business.id);
    for (const answer of [
      {
        sectionKey: "identity" as const,
        questionKey: "identity.employees",
        value: 5,
      },
      {
        sectionKey: "sales" as const,
        questionKey: "sales.follow_up_process",
        value: "manual",
      },
      {
        sectionKey: "operations" as const,
        questionKey: "operations.scheduling",
        value: "spreadsheet",
      },
      {
        sectionKey: "technology" as const,
        questionKey: "technology.crm",
        value: false,
      },
      {
        sectionKey: "goals" as const,
        questionKey: "goals.priorities",
        value: ["growth", "automation"],
      },
    ]) {
      await api.businessMri.answer(orgId, mri.id, answer);
    }
    await api.businessMri.complete(orgId, mri.id);
    const dna = await api.businessDna.generate(orgId, business.id, mri.id);
    const diagnostic = await api.businessHealth.generate(
      orgId,
      business.id,
      mri.id,
    );
    expect(dna.businessId).toBe(business.id);
    expect(diagnostic.health.overallScore).toBeGreaterThan(0);

    const context = {
      orgId,
      businessId: business.id,
      actorId: authorization.identity.userId,
      requestId: authorization.requestId,
      correlationId: "business-lifecycle-1",
      traceId: authorization.traceId,
    };
    const telemetry = new InMemoryRuntimeTelemetry();
    const eventBus = new InMemoryEventBus();
    const completedEvents: string[] = [];
    eventBus.subscribe<{ definitionId: string }>(
      "workflow.completed",
      (event) => {
        completedEvents.push(event.payload.definitionId);
      },
    );
    const model: AgentModel = {
      execute: async (input) => ({
        insight: `Prioritize business health at ${diagnostic.health.overallScore}.`,
        promptCount: input.promptTemplates.length,
      }),
    };
    const agent = new AgentRuntime(
      model,
      {
        retrieve: async () => ({
          businessId: business.id,
          healthScore: diagnostic.health.overallScore,
        }),
      },
      new InMemoryAgentMemoryStore(),
      new Map([
        [
          "business_health_api",
          {
            id: "business_health_api",
            invoke: async () => diagnostic.health,
          },
        ],
      ]),
      eventBus,
      telemetry,
      undefined,
      undefined,
      {
        assertReady: async () => undefined,
      },
    );
    const workflow = new WorkflowRuntime(
      new InMemoryWorkflowExecutionStore(),
      eventBus,
      telemetry,
      undefined,
      {
        assertReady: async () => undefined,
      },
    );
    const queue = new InMemoryQueueRuntime(telemetry);
    const runtime = new BossRuntime(
      workflow,
      agent,
      queue,
      new InMemorySchedulerRuntime(),
      telemetry,
    );
    runtime.start(["ceo_advisor"]);

    let report:
      | {
          businessId: string;
          healthScore: number;
          insight: unknown;
        }
      | undefined;
    runtime.registerQueueHandler("report.generate", async (job) => {
      const payload = job.payload as {
        businessId: string;
        healthScore: number;
        insight: unknown;
      };
      report = payload;
    });

    let agentInsight: unknown;
    const execution = await workflow.execute(
      {
        id: "administrative_automation",
        steps: [
          {
            id: "approval",
            kind: "approval",
            approve: async () => true,
            execute: async () => ({ approvedBy: context.actorId }),
          },
          {
            id: "agent_orchestration",
            kind: "action",
            execute: async () => {
              const agentExecution = await agent.execute(
                "ceo_advisor",
                { businessId: business.id },
                context,
                ["business_health_api"],
              );
              agentInsight = agentExecution.output;
              return agentExecution.output;
            },
          },
          {
            id: "automation",
            kind: "action",
            execute: async () =>
              queue.enqueue(
                "report.generate",
                {
                  businessId: business.id,
                  healthScore: diagnostic.health.overallScore,
                  insight: agentInsight,
                },
                context,
              ).id,
          },
        ],
      },
      business.id,
      { diagnosticId: mri.id },
      context,
    );
    expect(execution.state).toBe("completed");
    await runtime.tick();

    expect(completedEvents).toEqual(["administrative_automation"]);
    expect(report).toEqual({
      businessId: business.id,
      healthScore: diagnostic.health.overallScore,
      insight: expect.objectContaining({
        promptCount: 1,
      }),
    });
    expect(telemetry.metrics().map((metric) => metric.name)).toEqual(
      expect.arrayContaining([
        "agent.duration",
        "workflow.duration",
        "queue.enqueued",
        "queue.completed",
      ]),
    );
    expect(runtime.health()).toEqual(
      expect.objectContaining({
        state: "running",
        queueDepth: 0,
        deadLetterCount: 0,
      }),
    );

    await identity.signOut(signup.session!.accessToken);
    await expect(
      identity.authorize({
        accessToken: signup.session!.accessToken,
        orgId,
        action: "business:read",
      }),
    ).rejects.toThrow(AuthenticationError);
    expect(runtime.shutdown().state).toBe("stopped");
  });
});
