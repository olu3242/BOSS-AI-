import type {
  BusinessCapabilityAssessment,
  BusinessConstraint,
  BusinessHealthDimension,
  BusinessRecommendation,
  ConstraintPriority,
  HealthTrend,
  RecommendationPriority,
} from "./ontology.js";

export type DiagnosticArea =
  | "operations"
  | "customers"
  | "sales"
  | "marketing"
  | "finance"
  | "team"
  | "productivity"
  | "technology"
  | "processes"
  | "ai_readiness"
  | "automation_readiness"
  | "growth_readiness";

export type DiagnosticMaturityArea =
  | "leadership"
  | "operations"
  | "sales"
  | "customer_experience"
  | "financial_discipline"
  | "technology"
  | "automation"
  | "data"
  | "ai_adoption";

export interface DiagnosticWeightProfile {
  readonly id: string;
  readonly version: string;
  readonly weights: Readonly<Record<DiagnosticArea, number>>;
}

export interface DiagnosticEvidence {
  readonly source:
    | "business_health"
    | "capability_assessment"
    | "constraint_analysis"
    | "recommendation_analysis";
  readonly referenceId: string;
  readonly description: string;
}

export interface DiagnosticAreaScore {
  readonly area: DiagnosticArea;
  readonly currentScore: number;
  readonly desiredScore: number;
  readonly gap: number;
  readonly trend: HealthTrend;
  readonly confidence: number;
  readonly businessImpact: number;
  readonly priority: number;
  readonly evidence: readonly DiagnosticEvidence[];
  readonly recommendedImprovement: string;
}

export interface DiagnosticRootCause {
  readonly id: string;
  readonly constraintId: string;
  readonly area: DiagnosticArea;
  readonly kind: "primary" | "contributing" | "blocker" | "risk";
  readonly title: string;
  readonly description: string;
  readonly businessImpact: string;
  readonly confidence: number;
  readonly dependencies: readonly string[];
  readonly evidence: readonly DiagnosticEvidence[];
}

export type DiagnosticOpportunityType =
  | "quick_win"
  | "high_impact"
  | "cost_reduction"
  | "revenue_growth"
  | "automation_candidate"
  | "ai_delegation_candidate";

export interface DiagnosticOpportunity {
  readonly id: string;
  readonly recommendationId: string;
  readonly type: DiagnosticOpportunityType;
  readonly title: string;
  readonly description: string;
  readonly expectedImpact: number;
  readonly effort: number;
  readonly confidence: number;
  readonly priority: number;
  readonly evidence: readonly DiagnosticEvidence[];
}

export interface DiagnosticMaturityAssessment {
  readonly area: DiagnosticMaturityArea;
  readonly level: 1 | 2 | 3 | 4 | 5;
  readonly score: number;
  readonly rationale: string;
  readonly confidence: number;
  readonly evidence: readonly DiagnosticEvidence[];
}

export interface DiagnosticPriorityItem {
  readonly sourceType: "root_cause" | "opportunity";
  readonly sourceId: string;
  readonly impact: number;
  readonly urgency: number;
  readonly effort: number;
  readonly confidence: number;
  readonly score: number;
  readonly rank: number;
}

export interface DiagnosticExecutiveSummary {
  readonly overview: string;
  readonly topStrengths: readonly string[];
  readonly topWeaknesses: readonly string[];
  readonly immediatePriorities: readonly string[];
  readonly thirtyDayFocus: readonly string[];
  readonly mediumTermImprovements: readonly string[];
  readonly longTermOpportunities: readonly string[];
}

export interface BusinessDiagnosticReport {
  readonly id: string;
  readonly orgId: string;
  readonly businessId: string;
  readonly businessMriId: string;
  readonly weightProfileId: string;
  readonly weightProfileVersion: string;
  readonly overallHealth: number;
  readonly confidence: number;
  readonly areaScores: readonly DiagnosticAreaScore[];
  readonly rootCauses: readonly DiagnosticRootCause[];
  readonly opportunities: readonly DiagnosticOpportunity[];
  readonly maturity: readonly DiagnosticMaturityAssessment[];
  readonly priorities: readonly DiagnosticPriorityItem[];
  readonly summary: DiagnosticExecutiveSummary;
  readonly generatedAt: string;
  readonly version: number;
}

export interface DiagnosticAnalysisInput {
  readonly reportId: string;
  readonly orgId: string;
  readonly businessId: string;
  readonly businessMriId: string;
  readonly generatedAt: string;
  readonly version: number;
  readonly healthDimensions: readonly BusinessHealthDimension[];
  readonly capabilities: readonly BusinessCapabilityAssessment[];
  readonly constraints: readonly BusinessConstraint[];
  readonly constraintPriorities: readonly ConstraintPriority[];
  readonly recommendations: readonly BusinessRecommendation[];
  readonly recommendationPriorities: readonly RecommendationPriority[];
}
