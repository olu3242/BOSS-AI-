import Anthropic from "@anthropic-ai/sdk";

export interface AiInferenceRequest {
  employeeKey: string;
  employeeRole: string;
  employeeMission: string;
  capabilityKey: string;
  taskInput: Record<string, unknown>;
}

export interface AiInferenceResult {
  reasoning: string;
  enrichedInput: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
}

const SYSTEM_PROMPT = `You are an AI employee in a business operating system. You receive task requests
and produce structured reasoning + enriched parameters for tool execution.
Always respond with valid JSON matching the exact shape requested. No markdown, no preamble.`;

export async function runAiEmployeeInference(
  request: AiInferenceRequest,
  apiKey?: string,
  systemPromptOverride?: string,
): Promise<AiInferenceResult> {
  const client = new Anthropic({ apiKey });

  const userPrompt = `You are ${request.employeeRole}. Mission: ${request.employeeMission}.

Task: Execute the "${request.capabilityKey}" capability for employee key "${request.employeeKey}".
Input provided: ${JSON.stringify(request.taskInput, null, 2)}

Respond with this JSON structure:
{
  "reasoning": "1-2 sentences on what you will do and why",
  "enrichedInput": { ...all original input fields plus any derived parameters you add },
  "confidence": "high" | "medium" | "low"
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPromptOverride ?? SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";

  try {
    const parsed = JSON.parse(text) as AiInferenceResult;
    return {
      reasoning: String(parsed.reasoning ?? ""),
      enrichedInput: (parsed.enrichedInput as Record<string, unknown>) ?? request.taskInput,
      confidence: (["high", "medium", "low"] as const).includes(parsed.confidence)
        ? parsed.confidence
        : "low",
    };
  } catch {
    return {
      reasoning: text.slice(0, 200),
      enrichedInput: request.taskInput,
      confidence: "low",
    };
  }
}
