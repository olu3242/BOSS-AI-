/**
 * AI Employee Execution Service — RC4 TD-024 resolution.
 *
 * Provides the full execution pipeline for an AI employee task:
 * 1. Resolve prompt template from promptRegistry
 * 2. Inject short-term memory context from memoryRecords
 * 3. Run LLM inference via @boss/mcp claudeInference
 * 4. Evaluate escalation rules against inference output
 * 5. Persist execution memory + emit domain events
 *
 * Architecture law: this service is the ONLY path for AI employee execution.
 * loopRuntimeService delegates its "ai" handler here.
 */
import { runAiEmployeeInference } from "@boss/mcp";
import { aiEmployeeRegistry, promptRegistry } from "@boss/registries";
import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../container.js";

export interface AiEmployeeExecutionInput {
  orgId: string;
  businessId: string;
  employeeKey: string;
  capabilityKey: string;
  requestedBy: string;
  taskInput: Record<string, unknown>;
}

export interface AiEmployeeExecutionResult {
  employeeKey: string;
  capabilityKey: string;
  reasoning: string;
  enrichedInput: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  escalated: boolean;
  escalationReason: string | null;
  executedAt: string;
}

function evaluateEscalationRules(
  escalationRules: string[],
  confidence: "high" | "medium" | "low",
  taskInput: Record<string, unknown>,
): { escalate: boolean; reason: string | null } {
  for (const rule of escalationRules) {
    if (rule.includes("low_confidence") && confidence === "low") {
      return { escalate: true, reason: `Confidence too low (${confidence}) — ${rule}` };
    }
    if (rule.includes("missing_required") && Object.keys(taskInput).length === 0) {
      return { escalate: true, reason: `Missing required input — ${rule}` };
    }
  }
  return { escalate: false, reason: null };
}

export interface AiEmployeeExecutionService {
  execute(input: AiEmployeeExecutionInput): Promise<AiEmployeeExecutionResult>;
  getMemoryContext(orgId: string, businessId: string, employeeKey: string): Promise<Record<string, unknown>>;
}

export function createAiEmployeeExecutionService(repos: RepositoryContainer): AiEmployeeExecutionService {
  return {
    async getMemoryContext(orgId, businessId, employeeKey) {
      const employee = aiEmployeeRegistry.get(employeeKey);
      if (!employee) return {};

      const contextKeys = employee.memory.contextKeys;
      if (contextKeys.length === 0) {
        // Return last execution regardless if no specific context keys configured
        const lastExec = await repos.memoryRecords
          .get(orgId, businessId, "agent", employeeKey, `last_execution:${employeeKey}`)
          .catch(() => null);
        return lastExec ? { lastExecution: lastExec.value } : {};
      }

      const records = await Promise.all(
        contextKeys.map((key) =>
          repos.memoryRecords
            .get(orgId, businessId, "agent", employeeKey, key)
            .catch(() => null),
        ),
      );

      const context: Record<string, unknown> = {};
      for (let i = 0; i < contextKeys.length; i++) {
        const record = records[i];
        if (record && record.value !== undefined) {
          const key = contextKeys[i];
          if (key !== undefined) context[key] = record.value;
        }
      }
      return context;
    },

    async execute(input) {
      const { orgId, businessId, employeeKey, capabilityKey, taskInput } = input;
      const executedAt = nowIso();

      const employee = aiEmployeeRegistry.get(employeeKey);
      if (!employee) {
        throw new Error(`Unknown AI employee: ${employeeKey}`);
      }

      // 1. Resolve prompt template
      const promptKey = employee.promptTemplateKey || `${employeeKey}.system`;
      const promptEntry = promptRegistry.get(promptKey);
      const systemPrompt = promptEntry?.template ?? null;

      // 2. Inject memory context
      const memoryContext = await this.getMemoryContext(orgId, businessId, employeeKey);
      const enrichedTaskInput = Object.keys(memoryContext).length > 0
        ? { ...taskInput, _memoryContext: memoryContext }
        : taskInput;

      // 3. Run LLM inference (requires ANTHROPIC_API_KEY; graceful fallback if absent)
      let reasoning = "Inference skipped — no API key configured";
      let enrichedInput: Record<string, unknown> = taskInput;
      let confidence: "high" | "medium" | "low" = "low";

      if (process.env.ANTHROPIC_API_KEY) {
        const inference = await runAiEmployeeInference(
          {
            employeeKey,
            employeeRole: employee.label,
            employeeMission: employee.mission,
            capabilityKey,
            taskInput: enrichedTaskInput,
          },
          process.env.ANTHROPIC_API_KEY,
          systemPrompt ?? undefined,
        ).catch(() => null);

        if (inference) {
          reasoning = inference.reasoning;
          enrichedInput = inference.enrichedInput;
          confidence = inference.confidence;
        }
      }

      // 4. Evaluate escalation rules
      const { escalate, reason: escalationReason } = evaluateEscalationRules(
        employee.escalationRules,
        confidence,
        enrichedInput,
      );

      // 5. Persist to short-term memory (respects TTL from employee config)
      const ttlMs = employee.memory.shortTermTtlMinutes * 60 * 1000;
      const expiresAt = new Date(Date.now() + ttlMs).toISOString();

      await repos.memoryRecords.upsert({
        orgId,
        businessId,
        ownerType: "agent",
        ownerId: employeeKey,
        key: `last_execution:${capabilityKey}`,
        value: { reasoning, confidence, escalated: escalate, executedAt },
        expiresAt,
      });

      // 6. Emit domain event
      await repos.eventBus.publish({
        type: escalate ? "ai_employee.task.escalated" : "ai_employee.inference.completed",
        payload: {
          orgId,
          businessId,
          employeeKey,
          capabilityKey,
          reasoning,
          confidence,
          escalated: escalate,
          escalationReason,
        },
        occurredAt: executedAt,
      });

      return {
        employeeKey,
        capabilityKey,
        reasoning,
        enrichedInput,
        confidence,
        escalated: escalate,
        escalationReason,
        executedAt,
      };
    },
  };
}
