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

export interface BusinessMRI extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  version: string;
  completedAt: string | null;
}

export interface BusinessDNA extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  growthStage: string;
  technologyMaturity: string;
  riskProfile: string;
  communicationStyle: string;
  customerModel: string;
  revenueModel: string;
  operationalComplexity: string;
  decisionStyle: string;
}

export interface BusinessHealth extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  overallScore: number;
}

export interface BusinessTimelineEntry extends TenantScoped, Timestamped {
  id: ID;
  businessId: ID;
  type: string;
  description: string;
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
