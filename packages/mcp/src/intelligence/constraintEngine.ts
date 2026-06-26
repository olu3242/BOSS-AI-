import type {
  BusinessMriResponse,
  ConstraintCategoryKey,
  ConstraintEvidenceItem,
  ConstraintImpactEstimate,
  ConstraintPriorityLevel,
  ConstraintSeverity,
  ImpactLevel,
} from "@boss/types";
import { constraintDefinitionRegistry } from "@boss/registries";
import type { ConstraintDetectionRule } from "@boss/registries";
import { toResponseMap } from "./responseMap.js";

export interface HealthDimensionInput {
  dimensionKey: string;
  score: number;
}

export interface CapabilityInput {
  capabilityKey: string;
  currentMaturity: string;
}

export interface DetectedConstraint {
  definitionKey: string;
  title: string;
  description: string;
  category: ConstraintCategoryKey;
  severity: ConstraintSeverity;
  confidence: number;
  businessImpact: string;
  financialImpact: ConstraintImpactEstimate;
  customerImpact: ImpactLevel;
  operationalImpact: ImpactLevel;
  automationPotential: ImpactLevel;
  businessOwner: string;
  evidence: ConstraintEvidenceItem[];
  dependencies: string[];
}

const IMPACT_RANK: Record<ImpactLevel, number> = { low: 1, medium: 2, high: 3 };

function evaluateRule(
  rule: ConstraintDetectionRule,
  responseMap: Map<string, unknown>,
  healthByDimension: Map<string, number>,
  capabilityByKey: Map<string, string>,
): ConstraintEvidenceItem | null {
  switch (rule.type) {
    case "mri_response_equals": {
      const value = responseMap.get(rule.questionKey);
      if (value === rule.value) {
        return {
          source: "business_mri",
          description: `MRI response "${rule.questionKey}" is ${String(value)}.`,
          data: { questionKey: rule.questionKey, value },
        };
      }
      return null;
    }
    case "mri_response_in": {
      const value = responseMap.get(rule.questionKey);
      if (rule.values.includes(value)) {
        return {
          source: "business_mri",
          description: `MRI response "${rule.questionKey}" is ${String(value)}.`,
          data: { questionKey: rule.questionKey, value },
        };
      }
      return null;
    }
    case "mri_response_includes": {
      const value = responseMap.get(rule.questionKey);
      if (Array.isArray(value) && value.includes(rule.value)) {
        return {
          source: "business_mri",
          description: `MRI response "${rule.questionKey}" includes ${String(rule.value)}.`,
          data: { questionKey: rule.questionKey, value },
        };
      }
      return null;
    }
    case "health_dimension_below": {
      const score = healthByDimension.get(rule.dimensionKey);
      if (typeof score === "number" && score < rule.threshold) {
        return {
          source: "business_health",
          description: `Business Health dimension "${rule.dimensionKey}" scored ${score}, below threshold ${rule.threshold}.`,
          data: { dimensionKey: rule.dimensionKey, score, threshold: rule.threshold },
        };
      }
      return null;
    }
    case "capability_maturity_in": {
      const maturity = capabilityByKey.get(rule.capabilityKey);
      if (maturity !== undefined && rule.maturities.includes(maturity)) {
        return {
          source: "capability_assessment",
          description: `Capability "${rule.capabilityKey}" maturity is ${maturity}.`,
          data: { capabilityKey: rule.capabilityKey, maturity },
        };
      }
      return null;
    }
  }
}

function scaleImpact(level: ImpactLevel, employeeCount: number): number {
  const sizeFactor = Math.max(1, Math.min(3, employeeCount / 5));
  return IMPACT_RANK[level] * sizeFactor;
}

/**
 * Deterministic, registry-driven constraint detection. Every detected
 * constraint cites the specific MRI response, health dimension score, or
 * capability maturity that triggered it — no free-form reasoning.
 */
export function detectConstraints(
  responses: BusinessMriResponse[],
  healthDimensions: HealthDimensionInput[],
  capabilities: CapabilityInput[],
  employeeCount: number,
): DetectedConstraint[] {
  const responseMap = toResponseMap(responses);
  const healthByDimension = new Map(healthDimensions.map((d) => [d.dimensionKey, d.score]));
  const capabilityByKey = new Map(capabilities.map((c) => [c.capabilityKey, c.currentMaturity]));

  const detected: DetectedConstraint[] = [];

  for (const definition of constraintDefinitionRegistry.list()) {
    const evidence: ConstraintEvidenceItem[] = [];
    for (const rule of definition.detectionRules) {
      const matched = evaluateRule(rule, responseMap, healthByDimension, capabilityByKey);
      if (matched) {
        evidence.push(matched);
      }
    }
    if (evidence.length === 0) {
      continue;
    }

    const sizeFactor = Math.max(1, Math.min(3, employeeCount / 5));
    const financialImpact: ConstraintImpactEstimate = {
      revenueLossAnnual: Math.round(definition.impactModel.revenueLossAnnualBase * sizeFactor),
      timeLostHoursWeekly: definition.impactModel.timeLostHoursWeekly,
      customerImpact: definition.impactModel.customerImpact,
      operationalFriction: definition.impactModel.operationalFriction,
      growthLimitation: definition.impactModel.growthLimitation,
      ownerStress: definition.impactModel.ownerStress,
      confidence: Math.min(0.95, 0.6 + evidence.length * 0.1),
    };

    detected.push({
      definitionKey: definition.definitionKey,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      severity: definition.defaultSeverity,
      confidence: financialImpact.confidence,
      businessImpact: `${definition.title} contributes to ${definition.impactModel.growthLimitation} growth limitation and ${definition.impactModel.operationalFriction} operational friction.`,
      financialImpact,
      customerImpact: definition.impactModel.customerImpact,
      operationalImpact: definition.impactModel.operationalFriction,
      automationPotential: definition.automationPotential,
      businessOwner: definition.businessOwner,
      evidence,
      dependencies: definition.relatedCapabilities,
    });
  }

  return detected;
}

export interface ConstraintScoreResult {
  definitionKey: string;
  businessImpactScore: number;
  financialImpactScore: number;
  customerImpactScore: number;
  urgencyScore: number;
  automationScore: number;
  confidenceScore: number;
  overallScore: number;
  priority: ConstraintPriorityLevel;
  rank: number;
}

const SEVERITY_RANK: Record<ConstraintSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  informational: 1,
};

/**
 * Deterministic priority scoring: a fixed weighted function of severity,
 * impact factors, automation potential, and confidence. No hidden state.
 */
export function prioritizeConstraints(
  constraints: DetectedConstraint[],
  employeeCount: number,
): ConstraintScoreResult[] {
  const scored = constraints.map((constraint) => {
    const businessImpactScore = SEVERITY_RANK[constraint.severity] * 20;
    const financialImpactScore = Math.min(
      100,
      (constraint.financialImpact.revenueLossAnnual / Math.max(1000, employeeCount * 5000)) * 100,
    );
    const customerImpactScore = scaleImpact(constraint.customerImpact, employeeCount) * (100 / 9);
    const urgencyScore = scaleImpact(constraint.operationalImpact, employeeCount) * (100 / 9);
    const automationScore = IMPACT_RANK[constraint.automationPotential] * (100 / 3);
    const confidenceScore = constraint.confidence * 100;

    const overallScore =
      businessImpactScore * 0.3 +
      financialImpactScore * 0.25 +
      customerImpactScore * 0.15 +
      urgencyScore * 0.15 +
      automationScore * 0.1 +
      confidenceScore * 0.05;

    return {
      definitionKey: constraint.definitionKey,
      businessImpactScore: Math.round(businessImpactScore),
      financialImpactScore: Math.round(financialImpactScore),
      customerImpactScore: Math.round(customerImpactScore),
      urgencyScore: Math.round(urgencyScore),
      automationScore: Math.round(automationScore),
      confidenceScore: Math.round(confidenceScore),
      overallScore: Math.round(overallScore),
    };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);

  return scored.map((score, index) => ({
    ...score,
    priority: priorityForScore(score.overallScore),
    rank: index + 1,
  }));
}

function priorityForScore(score: number): ConstraintPriorityLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "informational";
}
