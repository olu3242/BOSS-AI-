import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import {
  agentRegistry,
  promptRegistry,
  type Agent,
} from "@boss/registries";
import {
  UnconfiguredExecutionContextGuard,
  type ExecutionContext,
  type ExecutionContextGuard,
} from "./runtimeTypes.js";
import type { RuntimeTelemetry } from "./telemetry.js";

export type AgentRuntimeState = "inactive" | "active" | "executing" | "error";

export interface AgentContextProvider {
  retrieve(
    agent: Agent,
    context: ExecutionContext,
    input: unknown,
  ): Promise<Readonly<Record<string, unknown>>>;
}

export interface AgentMemoryStore {
  get(orgId: string, agentId: string): Promise<Readonly<Record<string, unknown>>>;
  set(orgId: string, agentId: string, key: string, value: unknown): Promise<void>;
}

export class InMemoryAgentMemoryStore implements AgentMemoryStore {
  private readonly memory = new Map<string, Record<string, unknown>>();

  async get(
    orgId: string,
    agentId: string,
  ): Promise<Readonly<Record<string, unknown>>> {
    return Object.freeze({
      ...(this.memory.get(`${orgId}:${agentId}`) ?? {}),
    });
  }

  async set(
    orgId: string,
    agentId: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    const memoryKey = `${orgId}:${agentId}`;
    this.memory.set(memoryKey, {
      ...(this.memory.get(memoryKey) ?? {}),
      [key]: value,
    });
  }
}

export interface AgentTool {
  readonly id: string;
  invoke(
    input: unknown,
    context: ExecutionContext,
  ): Promise<unknown>;
}

export interface AgentModelInput {
  readonly agent: Agent;
  readonly promptTemplates: readonly string[];
  readonly input: unknown;
  readonly retrievedContext: Readonly<Record<string, unknown>>;
  readonly memory: Readonly<Record<string, unknown>>;
  readonly toolResults: Readonly<Record<string, unknown>>;
}

export interface AgentModel {
  execute(input: AgentModelInput, context: ExecutionContext): Promise<unknown>;
}

export interface AgentExecution {
  readonly id: string;
  readonly agentId: string;
  readonly context: ExecutionContext;
  readonly state: "completed" | "failed";
  readonly output: unknown;
  readonly error: string | null;
  readonly startedAt: string;
  readonly completedAt: string;
}

export interface AgentExecutionSink {
  record(execution: AgentExecution): Promise<void>;
}

export class InMemoryAgentExecutionSink implements AgentExecutionSink {
  private readonly executions: AgentExecution[] = [];

  async record(execution: AgentExecution): Promise<void> {
    this.executions.push(Object.freeze(execution));
  }

  list(orgId: string): readonly AgentExecution[] {
    return Object.freeze(
      this.executions.filter(
        (execution) => execution.context.orgId === orgId,
      ),
    );
  }
}

export class AgentRuntime {
  private readonly states = new Map<string, AgentRuntimeState>();
  private readonly executions: AgentExecution[] = [];

  constructor(
    private readonly model: AgentModel,
    private readonly contextProvider: AgentContextProvider,
    private readonly memory: AgentMemoryStore,
    private readonly tools: ReadonlyMap<string, AgentTool>,
    private readonly eventBus: EventBus,
    private readonly telemetry: RuntimeTelemetry,
    private readonly definitions: {
      readonly agents: { get(id: string): Agent | undefined };
      readonly prompts: {
        get(id: string): { readonly template: string } | undefined;
      };
    } = {
      agents: agentRegistry,
      prompts: promptRegistry,
    },
    private readonly executionSink: AgentExecutionSink =
      new InMemoryAgentExecutionSink(),
    private readonly contextGuard: ExecutionContextGuard =
      new UnconfiguredExecutionContextGuard(),
  ) {}

  activate(agentId: string): void {
    if (!this.definitions.agents.get(agentId)) {
      throw new Error(`Agent "${agentId}" is not registered.`);
    }
    this.states.set(agentId, "active");
  }

  deactivate(agentId: string): void {
    this.states.set(agentId, "inactive");
  }

  state(agentId: string): AgentRuntimeState {
    return this.states.get(agentId) ?? "inactive";
  }

  activeExecutionCount(): number {
    return Array.from(this.states.values()).filter(
      (state) => state === "executing",
    ).length;
  }

  history(orgId: string): readonly AgentExecution[] {
    return Object.freeze(
      this.executions.filter(
        (execution) => execution.context.orgId === orgId,
      ),
    );
  }

  async execute(
    agentId: string,
    input: unknown,
    context: ExecutionContext,
    toolIds: readonly string[] = [],
  ): Promise<AgentExecution> {
    const agent = this.definitions.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent "${agentId}" is not registered.`);
    }
    if (this.state(agentId) !== "active") {
      throw new Error(`Agent "${agentId}" is not active.`);
    }
    if (!context.businessId) {
      throw new Error("Agent execution requires a businessId in its context.");
    }
    await this.contextGuard.assertReady(context.businessId, context);
    for (const toolId of toolIds) {
      if (!agent.dependencies.tools.includes(toolId)) {
        throw new Error(`Agent "${agentId}" is not permitted to invoke tool "${toolId}".`);
      }
    }

    const executionId = randomUUID();
    const startedAt = new Date().toISOString();
    this.states.set(agentId, "executing");
    await this.eventBus.publish(
      createBossEvent("agent.started", { executionId, agentId }, context),
    );
    const started = performance.now();

    try {
      const retrievedContext = await this.contextProvider.retrieve(
        agent,
        context,
        input,
      );
      const storedMemory = await this.memory.get(context.orgId, agentId);
      const promptTemplates = agent.prompts.map((reference) => {
        const prompt = this.definitions.prompts.get(reference.id);
        if (!prompt) {
          throw new Error(`Prompt "${reference.id}" is not registered.`);
        }
        return prompt.template;
      });
      const toolResults: Record<string, unknown> = {};
      for (const toolId of toolIds) {
        const tool = this.tools.get(toolId);
        if (!tool) {
          throw new Error(`Tool "${toolId}" is not available.`);
        }
        toolResults[toolId] = await tool.invoke(input, context);
      }

      const output = await this.model.execute(
        {
          agent,
          promptTemplates,
          input,
          retrievedContext,
          memory: storedMemory,
          toolResults: Object.freeze(toolResults),
        },
        context,
      );
      await this.memory.set(
        context.orgId,
        agentId,
        "lastExecutionId",
        executionId,
      );
      const execution: AgentExecution = Object.freeze({
        id: executionId,
        agentId,
        context,
        state: "completed",
        output,
        error: null,
        startedAt,
        completedAt: new Date().toISOString(),
      });
      this.executions.push(execution);
      await this.executionSink.record(execution);
      this.states.set(agentId, "active");
      await this.eventBus.publish(
        createBossEvent("agent.completed", { executionId, agentId }, context),
      );
      this.telemetry.metric(
        "agent.duration",
        Math.max(0, Math.round(performance.now() - started)),
        "milliseconds",
        context,
        { agentId, state: "completed" },
      );
      return execution;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const execution: AgentExecution = Object.freeze({
        id: executionId,
        agentId,
        context,
        state: "failed",
        output: null,
        error: message,
        startedAt,
        completedAt: new Date().toISOString(),
      });
      this.executions.push(execution);
      await this.executionSink.record(execution);
      this.states.set(agentId, "error");
      this.telemetry.log("error", "Agent execution failed.", context, {
        executionId,
        agentId,
        error: message,
      });
      return execution;
    }
  }
}
