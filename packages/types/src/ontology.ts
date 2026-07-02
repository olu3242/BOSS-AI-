/**
 * Canonical BOSS Business Ontology.
 *
 * Every future module MUST extend these entities instead of inventing
 * competing concepts. This file is the single source of truth for the
 * shape of the BOSS business graph (see docs/architecture/BUSINESS_GRAPH.md
 * for the relationship model these entities participate in).
 */
import type { ID } from "./primitives.js";

export interface TenantScoped {
  orgId: ID;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Location extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  name: string;
  address: string;
  timezone: string;
}

export interface Department extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  name: string;
}

export interface Employee extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  departmentId: ID | null;
  name: string;
  role: string;
  email: string;
}

export interface Customer extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  name: string;
  email: string | null;
  phone: string | null;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface Lead extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  source: string;
  status: LeadStatus;
}

export interface Vendor extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  name: string;
}

export interface Product extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  name: string;
  price: number;
}

export interface Service extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  name: string;
  durationMinutes: number;
  price: number;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Appointment extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  customerId: ID;
  serviceId: ID;
  startsAt: string;
  status: AppointmentStatus;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface Invoice extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  customerId: ID;
  amount: number;
  status: InvoiceStatus;
  dueAt: string;
}

export type TaskStatus = "open" | "in_progress" | "done" | "blocked";

export interface Task extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  title: string;
  status: TaskStatus;
  assigneeId: ID | null;
}

export interface Capability {
  key: string;
  label: string;
  description: string;
}

export interface Constraint {
  key: string;
  label: string;
  description: string;
  relatedCapabilities: string[];
}

export interface KPI {
  key: string;
  label: string;
  description: string;
  formulaPlaceholder: string;
  owner: string;
  measurementFrequency: "daily" | "weekly" | "monthly" | "quarterly";
  targetRange: string;
}

export interface Recommendation extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  constraintKey: string;
  kpiKey: string;
  title: string;
  expectedRoi: string;
  confidence: number;
  priority: number;
}

export interface Goal extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  category: "growth" | "operational" | "customer" | "financial" | "technology";
  description: string;
}

export interface Report extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  type: string;
  content: Record<string, unknown>;
}

export interface Business extends TenantScoped, Timestamped {
  id: ID;
  name: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
}

export interface BusinessProfile extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  businessName: string;
  businessType: string;
  yearsOperating: number;
  employeeCount: number;
  locationCount: number;
  businessHours: string;
}

export type MriStatus = "not_started" | "in_progress" | "completed";

export interface BusinessMRI extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  version: string;
  status: MriStatus;
  startedAt: string | null;
  completedAt: string | null;
}

export type MriSectionKey =
  | "identity"
  | "customers"
  | "sales"
  | "operations"
  | "finance"
  | "marketing"
  | "technology"
  | "goals"
  | "pain_points";

export interface BusinessMriSection extends TenantScoped, Timestamped {
  id: ID;
  businessMriId: ID;
  sectionKey: MriSectionKey;
  startedAt: string | null;
  completedAt: string | null;
}

export type MriQuestionType =
  | "text"
  | "number"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "scale";

export interface BusinessMriResponse extends TenantScoped, Timestamped {
  id: ID;
  businessMriId: ID;
  sectionKey: MriSectionKey;
  questionKey: string;
  value: unknown;
  answeredAt: string;
}

export type BusinessArchetype =
  | "solo_operator"
  | "owner_operator"
  | "growth_stage_team"
  | "established_enterprise";

export type GrowthStage = "startup" | "early_growth" | "scaling" | "mature";

export type OperationalComplexity = "simple" | "moderate" | "complex" | "highly_complex";

export type TechnologyMaturity = "manual" | "basic_tools" | "integrated" | "advanced";

export type AutomationReadiness = "low" | "moderate" | "high" | "very_high";

export type CustomerEngagementStyle =
  | "transactional"
  | "relationship_driven"
  | "community_driven"
  | "self_service";

export type RevenueModel =
  | "one_time_sales"
  | "recurring_subscription"
  | "service_based"
  | "mixed";

export type CommunicationStyle = "formal" | "casual" | "high_touch" | "low_touch";

export type DecisionStyle = "data_driven" | "intuitive" | "consensus_driven" | "owner_led";

export type RiskProfile = "risk_averse" | "balanced" | "risk_tolerant";

export interface BusinessDNA extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  archetype: BusinessArchetype;
  growthStage: GrowthStage;
  operationalComplexity: OperationalComplexity;
  technologyMaturity: TechnologyMaturity;
  automationReadiness: AutomationReadiness;
  customerEngagementStyle: CustomerEngagementStyle;
  revenueModel: RevenueModel;
  communicationStyle: CommunicationStyle;
  decisionStyle: DecisionStyle;
  riskProfile: RiskProfile;
  generatedAt: string;
}

export type HealthDimensionKey =
  | "sales"
  | "marketing"
  | "operations"
  | "financial"
  | "customer_experience"
  | "team_productivity"
  | "technology"
  | "growth"
  | "ai_readiness"
  | "overall";

export type HealthTrend = "improving" | "stable" | "declining" | "unknown";

export type HealthStatus = "strong" | "healthy" | "at_risk" | "critical";

export interface BusinessHealth extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  overallScore: number;
  generatedAt: string;
}

export interface BusinessHealthDimension extends TenantScoped, Timestamped {
  id: ID;
  businessHealthId: ID;
  dimensionKey: HealthDimensionKey;
  score: number;
  confidence: number;
  trend: HealthTrend;
  evidence: string[];
  status: HealthStatus;
}

export type CapabilityMaturity = "absent" | "ad_hoc" | "developing" | "managed" | "optimized";

export interface BusinessCapabilityAssessment extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  capabilityKey: string;
  currentMaturity: CapabilityMaturity;
  businessImportance: "low" | "medium" | "high" | "critical";
  automationPotential: "low" | "medium" | "high";
  dependencies: string[];
  owner: string;
}

export type TimelineEventType =
  | "business_created"
  | "business_updated"
  | "business_mri_started"
  | "business_mri_completed"
  | "business_dna_generated"
  | "business_health_updated"
  | "capability_updated"
  | "constraint_analysis_completed"
  | "recommendations_generated"
  | "workflow_generated"
  | "diagnostic_completed";

export interface BusinessTimelineEntry extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  type: TimelineEventType;
  description: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export type ConstraintCategoryKey =
  | "sales"
  | "marketing"
  | "operations"
  | "scheduling"
  | "finance"
  | "customer_experience"
  | "communication"
  | "reporting"
  | "staff_productivity"
  | "compliance"
  | "technology"
  | "leadership"
  | "growth";

export type ConstraintSeverity = "critical" | "high" | "medium" | "low" | "informational";

export type ConstraintStatus = "active" | "monitoring" | "resolved" | "dismissed";

export type ImpactLevel = "low" | "medium" | "high";

export interface ConstraintEvidenceItem {
  source:
    | "business_mri"
    | "business_health"
    | "capability_assessment"
    | "business_timeline"
    | "business_profile"
    | "configuration"
    | "historical_assessment";
  description: string;
  data: Record<string, unknown>;
}

export interface ConstraintImpactEstimate {
  revenueLossAnnual: number;
  timeLostHoursWeekly: number;
  customerImpact: ImpactLevel;
  operationalFriction: ImpactLevel;
  growthLimitation: ImpactLevel;
  ownerStress: ImpactLevel;
  confidence: number;
}

export interface BusinessConstraint extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
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
  automationPotential: "low" | "medium" | "high";
  businessOwner: string;
  evidence: ConstraintEvidenceItem[];
  dependencies: string[];
  status: ConstraintStatus;
  dateDetected: string;
  version: number;
}

export type ConstraintPriorityLevel = "critical" | "high" | "medium" | "low" | "informational";

export interface ConstraintScore extends TenantScoped, Timestamped {
  id: ID;
  constraintId: ID;
  businessImpactScore: number;
  financialImpactScore: number;
  customerImpactScore: number;
  urgencyScore: number;
  automationScore: number;
  confidenceScore: number;
  overallScore: number;
}

export interface ConstraintPriority extends TenantScoped, Timestamped {
  id: ID;
  constraintId: ID;
  priority: ConstraintPriorityLevel;
  rank: number;
  computedAt: string;
}

export type RecommendationCategoryKey =
  | "sales"
  | "marketing"
  | "operations"
  | "customer_experience"
  | "finance"
  | "scheduling"
  | "communication"
  | "reporting"
  | "technology"
  | "leadership"
  | "growth"
  | "compliance"
  | "productivity";

export type RecommendationDifficulty = "low" | "medium" | "high";

export type RecommendationStage = "quick_wins" | "short_term" | "medium_term" | "strategic" | "long_term";

export type RecommendationApproval = "auto" | "approval_required" | "executive_review" | "manual_only";

export type RecommendationStatus = "proposed" | "approved" | "rejected" | "in_progress" | "completed" | "dismissed";

export type RecommendationPriorityLevel = "critical" | "high" | "medium" | "low" | "informational";

export interface RecommendationEvidenceItem {
  source: "constraint_analysis" | "business_health" | "capability_assessment" | "business_mri" | "configuration";
  description: string;
  data: Record<string, unknown>;
}

export interface RecommendationRoiEstimate {
  revenueIncreaseAnnual: number;
  timeSavedHoursWeekly: number;
  administrativeReductionHours: number;
  customerRetentionIncreasePct: number;
  leadConversionImprovementPct: number;
  profitImpactAnnual: number;
  ownerTimeSavedHoursWeekly: number;
  riskReduction: ImpactLevel;
  confidence: number;
}

export interface BusinessRecommendation extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  definitionKey: string;
  title: string;
  description: string;
  businessGoal: string;
  category: RecommendationCategoryKey;
  relatedCapabilities: string[];
  relatedConstraintIds: string[];
  relatedKpiKeys: string[];
  expectedOutcome: string;
  difficulty: RecommendationDifficulty;
  estimatedEffortHours: number;
  estimatedCost: number;
  estimatedRoi: RecommendationRoiEstimate;
  estimatedTimeToValueDays: number;
  confidence: number;
  evidence: RecommendationEvidenceItem[];
  dependencies: string[];
  approval: RecommendationApproval;
  stage: RecommendationStage;
  status: RecommendationStatus;
  dateRecommended: string;
  version: number;
}

export interface RecommendationScore extends TenantScoped, Timestamped {
  id: ID;
  recommendationId: ID;
  priorityScore: number;
  businessValueScore: number;
  implementationScore: number;
  strategicScore: number;
  overallScore: number;
}

export interface RecommendationPriority extends TenantScoped, Timestamped {
  id: ID;
  recommendationId: ID;
  priority: RecommendationPriorityLevel;
  rank: number;
  computedAt: string;
}

export interface TransformationRoadmapStageEntry {
  stage: RecommendationStage;
  recommendationIds: string[];
}

export interface TransformationRoadmap extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  stages: TransformationRoadmapStageEntry[];
  generatedAt: string;
  version: number;
}

export type IntegrationAccountStatus = "connected" | "disconnected" | "error";

/** A business's connection to a Provider. Never stores raw secrets. */
export interface IntegrationAccount extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  providerKey: string;
  status: IntegrationAccountStatus;
  connectedAt: string | null;
  version: number;
}

/**
 * A reference to a credential held in an external secret store. The
 * Tool Fabric's own tables never persist raw secret material — only an
 * opaque pointer the runtime resolves at execution time.
 */
export interface CredentialReference extends TenantScoped, Timestamped {
  id: ID;
  integrationAccountId: ID;
  secretRef: string;
  rotatedAt: string | null;
}

export type PermissionApprovalRequirement = "auto" | "approval_required" | "executive_review" | "manual_only";

export interface PermissionPolicy extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  toolKey: string;
  roleKey: string;
  allowed: boolean;
  approval: PermissionApprovalRequirement;
  rateLimitPerMinute: number | null;
  version: number;
}

export type ToolExecutionStatus = "pending" | "succeeded" | "failed" | "rejected";

export interface ToolExecution extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  toolKey: string;
  capabilityKey: string;
  providerKey: string;
  requestedBy: string;
  status: ToolExecutionStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  attemptCount: number;
  latencyMs: number | null;
}

export type ProviderHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ProviderHealth extends TenantScoped {
  id: ID;
  businessId: ID;
  providerKey: string;
  status: ProviderHealthStatus;
  latencyMs: number | null;
  failureCount: number;
  quotaRemaining: number | null;
  authenticated: boolean;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolAuditRecord extends TenantScoped {
  id: ID;
  businessId: ID;
  toolExecutionId: ID;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface BossEventRecord extends TenantScoped {
  id: ID;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export type ExecutionState =
  | "pending"
  | "queued"
  | "running"
  | "waiting"
  | "approved"
  | "rejected"
  | "completed"
  | "failed"
  | "cancelled"
  | "rolled_back"
  | "timed_out";

export type TaskType = "ai" | "manual" | "scheduled" | "tool";

export interface WorkflowExecution extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  workflowKey: string;
  state: ExecutionState;
  currentStepIndex: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface TaskExecution extends TenantScoped, Timestamped {
  id: ID;
  workflowExecutionId: ID;
  businessId: ID;
  stepKey: string;
  taskType: TaskType;
  state: ExecutionState;
  attempt: number;
  maxRetries: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface ExecutionEventRecord extends TenantScoped {
  id: ID;
  workflowExecutionId: ID;
  businessId: ID;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface DeadLetterEntry extends TenantScoped, Timestamped {
  id: ID;
  workflowExecutionId: ID;
  taskExecutionId: ID;
  businessId: ID;
  stepKey: string;
  reason: string;
  payload: Record<string, unknown>;
}

export interface Notification extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  channel: "email" | "sms" | "in_app" | "webhook";
  message: string;
  sentAt: string | null;
}

export interface Integration extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  provider: string;
  status: "connected" | "disconnected" | "error";
}

export interface Policy {
  key: string;
  label: string;
  category: "approval" | "security" | "privacy" | "execution" | "escalation";
  description: string;
}

export interface MemoryRecord extends TenantScoped {
  id: ID;
  businessId: ID;
  ownerType: "agent" | "business";
  ownerId: ID;
  key: string;
  value: unknown;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SchedulerTriggerType = "immediate" | "delayed" | "cron" | "recurring";
export type SchedulerJobState = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface SchedulerJob extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  workflowKey: string;
  triggerType: SchedulerTriggerType;
  cronExpression: string | null;
  timezone: string;
  runAt: string;
  state: SchedulerJobState;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
  maxRuns: number | null;
  payload: Record<string, unknown>;
  errorMessage: string | null;
}

// ─── Decision Intelligence (Goal 21) ─────────────────────────────────────────

export type DecisionStatus =
  | "draft"
  | "generated"
  | "reviewed"
  | "approved"
  | "rejected"
  | "scheduled"
  | "executing"
  | "completed"
  | "measured"
  | "archived";

export type DecisionType =
  | "operational"
  | "strategic"
  | "financial"
  | "marketing"
  | "hiring"
  | "technology"
  | "expansion"
  | "risk_mitigation"
  | "customer_success"
  | "pricing";

export type DecisionImpactLevel = "low" | "medium" | "high" | "critical";

export interface DecisionOption {
  key: string;
  label: string;
  description: string;
  expectedRoi: number;
  expectedCost: number;
  expectedRisk: DecisionImpactLevel;
  confidence: number;
  tradeoffs: string[];
  estimatedTimelineDays: number;
}

export interface DecisionImpact {
  revenueImpact: number;
  costImpact: number;
  profitImpact: number;
  operationalImpact: DecisionImpactLevel;
  customerImpact: DecisionImpactLevel;
  riskLevel: DecisionImpactLevel;
  affectedDomains: string[];
  estimatedTimelineDays: number;
}

export interface BusinessDecision extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  decisionType: DecisionType;
  objective: string;
  context: string;
  supportingRecommendationIds: string[];
  supportingConstraintIds: string[];
  appliedPolicyKeys: string[];
  options: DecisionOption[];
  selectedOptionKey: string | null;
  expectedImpact: DecisionImpact;
  expectedRoi: number;
  expectedCost: number;
  confidenceScore: number;
  status: DecisionStatus;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  measuredAt: string | null;
  actualRoi: number | null;
  lessonsLearned: string | null;
  executiveSummary: string | null;
  generatedWorkflowId: string | null;
}

// ─── Scenario Simulation (Goal 22) ───────────────────────────────────────────

export type ScenarioType =
  | "revenue"
  | "marketing"
  | "sales"
  | "finance"
  | "operations"
  | "hiring"
  | "pricing"
  | "expansion"
  | "customer_success"
  | "automation"
  | "technology"
  | "risk";

export type ForecastPeriod = "30d" | "90d" | "180d" | "365d";

export type ScenarioStatus = "draft" | "calculated" | "approved" | "rejected" | "archived";

export interface ScenarioAssumption {
  key: string;
  label: string;
  value: number;
  unit: string;
}

export interface BusinessScenario extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  scenarioType: ScenarioType;
  objective: string;
  assumptions: ScenarioAssumption[];
  affectedDomains: string[];
  projectedRevenue: number;
  projectedCost: number;
  projectedProfit: number;
  operationalImpact: DecisionImpactLevel;
  customerImpact: DecisionImpactLevel;
  riskLevel: DecisionImpactLevel;
  confidenceScore: number;
  forecastPeriod: ForecastPeriod;
  version: number;
  status: ScenarioStatus;
}

export interface ScenarioComparison extends TenantScoped {
  id: ID;
  businessId: ID;
  scenarioIds: string[];
  recommendedScenarioId: string;
  rationale: string;
  createdAt: string;
}

export interface ProviderEvidence extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  toolExecutionId: ID;
  providerKey: string;
  toolKey: string;
  status: "succeeded" | "failed";
  latencyMs: number;
  attemptCount: number;
  errorCode: string | null;
  responseSnapshot: Record<string, unknown> | null;
}

// ─── KPI Time-Series ──────────────────────────────────────────────────────────

export interface KpiReadingRecord extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  kpiKey: string;
  label: string;
  value: number | null;
  unit: string;
  trend: "up" | "down" | "stable" | "unknown";
  source: "event_log" | "health_score" | "registry_default";
  measuredAt: string;
}

// ─── Business Goals / OKRs ────────────────────────────────────────────────────

export type GoalStatus = "active" | "paused" | "completed" | "cancelled";
export type GoalCategory = "growth" | "profitability" | "customer_experience" | "operations" | "automation" | "staff_productivity";

export interface GoalMilestone {
  key: string;
  label: string;
  targetValue: number;
  unit: string;
  dueDate: string;
  completedAt: string | null;
}

export interface BusinessGoal extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  category: GoalCategory;
  title: string;
  description: string;
  kpiKey: string | null;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  milestones: GoalMilestone[];
  status: GoalStatus;
}

// ─── Executive Briefings ──────────────────────────────────────────────────────

export type BriefingPeriod = "daily" | "weekly" | "monthly" | "quarterly";

export interface ExecutiveBriefingRecord extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  period: BriefingPeriod;
  headline: string;
  summary: string;
  topPriorities: string[];
  keyMetrics: Array<{ label: string; value: string; trend: string }>;
  alerts: Array<{ severity: "low" | "medium" | "high"; message: string }>;
  recommendations: string[];
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}
