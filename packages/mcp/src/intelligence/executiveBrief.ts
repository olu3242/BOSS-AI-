import Anthropic from "@anthropic-ai/sdk";
import type { BusinessDecision, BusinessHealth, BusinessRecommendation, BusinessConstraint } from "@boss/types";

export interface ExecutiveBriefInput {
  decision: BusinessDecision;
  health: BusinessHealth;
  topRecommendations: BusinessRecommendation[];
  topConstraints: BusinessConstraint[];
}

export interface ExecutiveBrief {
  businessHealthSummary: string;
  topOpportunities: string[];
  topRisks: string[];
  strategicOptions: string[];
  recommendedDecision: string;
  supportingEvidence: string;
  expectedRoiSummary: string;
  implementationTimeline: string;
  requiredApprovals: string[];
  executiveSummary: string;
}

const SYSTEM_PROMPT = `You are BOSS, an AI Business Operating System that produces executive decision intelligence briefs.
Write in clear, confident executive language. Be specific, data-driven, and actionable.
Always respond with valid JSON matching the exact structure requested. No markdown, no preamble.`;

function buildPrompt(input: ExecutiveBriefInput): string {
  const { decision, health, topRecommendations, topConstraints } = input;
  return `Generate an executive decision brief for this business situation:

Business Health Score: ${health.overallScore.toFixed(1)}/100
Active Constraints: ${topConstraints.map((c) => c.title).join(", ") || "None"}
Top Recommendations: ${topRecommendations.map((r) => r.title).join(", ") || "None"}
Decision Type: ${decision.decisionType}
Decision Objective: ${decision.objective}
Expected ROI: $${decision.expectedRoi.toLocaleString()}
Expected Cost: $${decision.expectedCost.toLocaleString()}
Confidence Score: ${(decision.confidenceScore * 100).toFixed(0)}%
Risk Level: ${decision.expectedImpact.riskLevel}
Affected Domains: ${decision.expectedImpact.affectedDomains.join(", ")}
Applied Policies: ${decision.appliedPolicyKeys.join(", ") || "None"}

Respond with this JSON:
{
  "businessHealthSummary": "2-3 sentence summary of current business health",
  "topOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "topRisks": ["risk 1", "risk 2"],
  "strategicOptions": ["option 1 with trade-off", "option 2 with trade-off"],
  "recommendedDecision": "1 sentence describing the recommended action",
  "supportingEvidence": "1-2 sentences citing the data that supports this decision",
  "expectedRoiSummary": "1 sentence quantifying expected return",
  "implementationTimeline": "1 sentence on timeline",
  "requiredApprovals": ["stakeholder or team that must approve"],
  "executiveSummary": "3-4 sentence executive summary tying everything together"
}`;
}

function fallbackBrief(input: ExecutiveBriefInput): ExecutiveBrief {
  const { decision, health } = input;
  return {
    businessHealthSummary: `Business health score is ${health.overallScore.toFixed(1)}/100. ${decision.context}`,
    topOpportunities: input.topRecommendations.slice(0, 3).map((r) => r.title),
    topRisks: input.topConstraints.slice(0, 2).map((c) => c.title),
    strategicOptions: decision.options.slice(0, 2).map((o) => `${o.label}: ${o.tradeoffs.join(", ")}`),
    recommendedDecision: decision.options.find((o) => o.key === decision.selectedOptionKey)?.label ?? decision.objective,
    supportingEvidence: `Based on ${decision.supportingRecommendationIds.length} recommendation(s) and ${decision.supportingConstraintIds.length} active constraint(s).`,
    expectedRoiSummary: `Expected ROI of $${decision.expectedRoi.toLocaleString()} with a confidence of ${(decision.confidenceScore * 100).toFixed(0)}%.`,
    implementationTimeline: `Estimated ${decision.expectedImpact.estimatedTimelineDays} days to value.`,
    requiredApprovals: decision.expectedImpact.riskLevel === "high" || decision.expectedImpact.riskLevel === "critical"
      ? ["Executive review required"]
      : ["Standard approval"],
    executiveSummary: `${decision.objective} This ${decision.decisionType} decision addresses current business constraints with an estimated ROI of $${decision.expectedRoi.toLocaleString()}. Risk level is ${decision.expectedImpact.riskLevel}. Approval and scheduling recommended within ${decision.expectedImpact.estimatedTimelineDays} days.`,
  };
}

/**
 * Generates an executive decision brief.
 * Uses Claude when ANTHROPIC_API_KEY is set; falls back to deterministic brief otherwise.
 * Intelligence stays in MCP (Law 1 preserved).
 */
export async function generateExecutiveBrief(
  input: ExecutiveBriefInput,
  apiKey?: string
): Promise<ExecutiveBrief> {
  if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
    return fallbackBrief(input);
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text) as ExecutiveBrief;
    return {
      businessHealthSummary: String(parsed.businessHealthSummary ?? ""),
      topOpportunities: Array.isArray(parsed.topOpportunities) ? parsed.topOpportunities : [],
      topRisks: Array.isArray(parsed.topRisks) ? parsed.topRisks : [],
      strategicOptions: Array.isArray(parsed.strategicOptions) ? parsed.strategicOptions : [],
      recommendedDecision: String(parsed.recommendedDecision ?? ""),
      supportingEvidence: String(parsed.supportingEvidence ?? ""),
      expectedRoiSummary: String(parsed.expectedRoiSummary ?? ""),
      implementationTimeline: String(parsed.implementationTimeline ?? ""),
      requiredApprovals: Array.isArray(parsed.requiredApprovals) ? parsed.requiredApprovals : [],
      executiveSummary: String(parsed.executiveSummary ?? ""),
    };
  } catch {
    return fallbackBrief(input);
  }
}
