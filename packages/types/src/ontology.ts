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
  | "capability_updated";

export interface BusinessTimelineEntry extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  type: TimelineEventType;
  description: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface BossEventRecord extends TenantScoped {
  id: ID;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
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
  ownerType: "agent" | "business";
  ownerId: ID;
  key: string;
  value: unknown;
  expiresAt: string | null;
}
