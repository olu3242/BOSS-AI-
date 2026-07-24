import { z } from "zod";
import type { Request } from "express";
import { ApiError } from "./apiError.js";

export function validate<S extends z.ZodTypeAny>(schema: S, req: Request): z.infer<S> {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(
      400,
      "validation_error",
      result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
    );
  }
  return result.data as z.infer<S>;
}

// ─── Business ────────────────────────────────────────────────────────────────

export const CreateBusinessSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().min(1),
  employeeCount: z.number().int().positive(),
  annualRevenue: z.number().nonnegative(),
  businessType: z.string().min(1),
  yearsOperating: z.number().int().nonnegative(),
  locationCount: z.number().int().positive().default(1),
  businessHours: z.string().default("Mon-Fri 9am-5pm"),
  services: z.string().max(2000).optional(),
  existingTools: z.array(z.string()).default([]),
  aiAgents: z.array(z.string()).default([]),
});

// ─── MRI ─────────────────────────────────────────────────────────────────────

export const SubmitMriResponseSchema = z.object({
  sectionKey: z.string().min(1),
  questionKey: z.string().min(1),
  value: z.unknown(),
});

// ─── Constraints ─────────────────────────────────────────────────────────────

export const UpdateConstraintStatusSchema = z.object({
  status: z.enum(["active", "monitoring", "resolved", "dismissed"]),
});

// ─── Recommendations ─────────────────────────────────────────────────────────

export const UpdateRecommendationStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "in_progress", "completed", "cancelled"]),
});

// ─── Tool Fabric ──────────────────────────────────────────────────────────────

export const SetPermissionSchema = z.object({
  toolKey: z.string().min(1),
  roleKey: z.string().min(1),
  allowed: z.boolean().default(true),
  approval: z.enum(["auto", "approval_required", "executive_review", "manual_only"]),
  rateLimitPerMinute: z.number().int().positive().nullable().default(null),
});

export const RequestToolSchema = z.object({
  capabilityKey: z.string().min(1),
  roleKey: z.string().min(1),
  requestedBy: z.string().min(1),
  input: z.record(z.unknown()).default({}),
});

// ─── Multi-Agent ──────────────────────────────────────────────────────────────

export const DelegateMultiAgentTaskSchema = z.object({
  goal: z.string().min(1).max(500),
  requiredCapabilities: z.array(z.string()).default([]),
  preferParallel: z.boolean().default(false),
  employeeKeys: z.array(z.string().min(1)).min(1),
});

// ─── Scheduler ────────────────────────────────────────────────────────────────

// ─── Decision Intelligence ────────────────────────────────────────────────────

export const GenerateDecisionSchema = z.object({
  recommendationIds: z.array(z.string()).default([]),
  decisionType: z
    .enum(["operational", "strategic", "financial", "marketing", "hiring", "technology", "expansion", "risk_mitigation", "customer_success", "pricing"])
    .optional(),
});

export const MeasureDecisionSchema = z.object({
  actualRoi: z.number(),
  lessonsLearned: z.string().min(1),
});

// ─── Scenario Simulation ──────────────────────────────────────────────────────

export const CreateScenarioSchema = z.object({
  scenarioType: z.enum(["revenue", "marketing", "sales", "finance", "operations", "hiring", "pricing", "expansion", "customer_success", "automation", "technology", "risk"]),
  objective: z.string().min(1).max(500),
  assumptions: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    value: z.number(),
    unit: z.string().min(1),
  })).default([]),
  forecastPeriod: z.enum(["30d", "90d", "180d", "365d"]).default("90d"),
});

export const CompareScenarioSchema = z.object({
  scenarioIds: z.array(z.string()).default([]),
});

// ─── Business Goals / OKRs ────────────────────────────────────────────────────

export const CreateGoalSchema = z.object({
  category: z.enum(["growth", "profitability", "customer_experience", "operations", "automation", "staff_productivity"]),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  kpiKey: z.string().min(1).nullable().optional(),
  targetValue: z.number().nullable().optional(),
  unit: z.string().min(1).nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
});

export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
});

export const UpdateGoalStatusSchema = z.object({
  status: z.enum(["active", "paused", "completed", "cancelled"]),
});

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION PLATFORM — Canonical entity schemas
// Every entity's create/update/patch input is validated here.
// Controllers import from this module — never define schemas inline.
// ══════════════════════════════════════════════════════════════════════════════

// ── Shared primitives ─────────────────────────────────────────────────────────

const uuid = z.string().uuid();
const isoDate = z.string().datetime({ offset: true });
const money = z.number().int().nonnegative(); // cents
const phone = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number");
const email = z.string().email();
const nonEmpty = z.string().min(1);

// ── Customer ──────────────────────────────────────────────────────────────────

export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  email: email.optional().nullable(),
  phone: phone.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// ── Lead ──────────────────────────────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: email.optional().nullable(),
  phone: phone.optional().nullable(),
  source: z.string().min(1).max(100).optional().nullable(),
  estimatedValue: money.optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  userId: uuid.optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.omit({ userId: true }).partial();

// ── Opportunity ───────────────────────────────────────────────────────────────

export const CreateOpportunitySchema = z.object({
  customerId: uuid.optional().nullable(),
  leadId: uuid.optional().nullable(),
  title: z.string().min(1).max(300),
  value: money.optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  expectedCloseDate: isoDate.optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial();

// ── Estimate ──────────────────────────────────────────────────────────────────

export const CreateEstimateSchema = z.object({
  customerId: uuid,
  title: z.string().min(1).max(300),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPriceCents: money,
  })).min(1),
  validUntil: isoDate.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const UpdateEstimateSchema = CreateEstimateSchema.partial();

// ── Appointment ───────────────────────────────────────────────────────────────

export const CreateAppointmentSchema = z.object({
  customerId: uuid,
  title: z.string().min(1).max(300),
  scheduledAt: isoDate,
  durationMinutes: z.number().int().positive().default(60),
  location: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  assignedTo: uuid.optional().nullable(),
});

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

// ── Job ────────────────────────────────────────────────────────────────────────

export const CreateJobSchema = z.object({
  customerId: uuid,
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  scheduledAt: isoDate.optional().nullable(),
  estimatedDurationHours: z.number().positive().optional().nullable(),
  assignedTo: uuid.optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const UpdateJobSchema = CreateJobSchema.partial();

// ── Invoice ───────────────────────────────────────────────────────────────────

export const CreateInvoiceSchema = z.object({
  customerId: uuid,
  jobId: uuid.optional().nullable(),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPriceCents: money,
  })).min(1),
  dueDate: isoDate.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

// ── Payment ───────────────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  invoiceId: uuid,
  amountCents: money,
  method: z.enum(["cash", "card", "bank_transfer", "check", "other"]),
  reference: z.string().max(200).optional().nullable(),
  paidAt: isoDate.optional(),
});

// ── Review ────────────────────────────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  customerId: uuid,
  jobId: uuid.optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
});

// ── Staff ─────────────────────────────────────────────────────────────────────

export const CreateStaffSchema = z.object({
  userId: uuid,
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  email: email.optional().nullable(),
  phone: phone.optional().nullable(),
  skills: z.array(z.string()).default([]),
});

export const UpdateStaffSchema = CreateStaffSchema.omit({ userId: true }).partial();

// ── Task ──────────────────────────────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  assignedTo: uuid.optional().nullable(),
  dueAt: isoDate.optional().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  relatedEntityType: z.string().max(100).optional().nullable(),
  relatedEntityId: uuid.optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

// ── Document ─────────────────────────────────────────────────────────────────

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.string().min(1).max(100),
  content: z.string().optional().nullable(),
  relatedEntityType: z.string().max(100).optional().nullable(),
  relatedEntityId: uuid.optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

// ── Conversation ──────────────────────────────────────────────────────────────

export const CreateConversationSchema = z.object({
  customerId: uuid.optional().nullable(),
  channel: z.enum(["sms", "email", "chat", "voice", "internal"]),
  subject: z.string().max(300).optional().nullable(),
  participants: z.array(uuid).default([]),
});

export const AddMessageSchema = z.object({
  body: nonEmpty,
  senderId: uuid,
  metadata: z.record(z.unknown()).default({}),
});

// ── Workflow ──────────────────────────────────────────────────────────────────

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  triggerEvent: nonEmpty,
  configuration: z.record(z.unknown()).default({}),
  ownerId: uuid.optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const UpdateWorkflowSchema = CreateWorkflowSchema.partial();

// ── LifecyclePolicy ───────────────────────────────────────────────────────────

export const LifecyclePolicyActionSchema = z.object({
  type: z.enum(["create_entity", "trigger_workflow", "notify"]),
  entity: z.string().optional(),
  workflowKey: z.string().optional(),
  defaults: z.record(z.unknown()).optional(),
  notificationTemplate: z.string().optional(),
});

export const CreateLifecyclePolicySchema = z.object({
  name: z.string().min(1).max(300),
  fromEvent: nonEmpty,
  mode: z.enum(["automatic", "approval_required", "manual"]),
  action: LifecyclePolicyActionSchema,
  conditions: z.record(z.unknown()).default({}),
  approvalRoles: z.array(z.string()).default([]),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateLifecyclePolicySchema = CreateLifecyclePolicySchema.partial();

// ── Search ────────────────────────────────────────────────────────────────────

export const SearchQuerySchema = z.object({
  entity: nonEmpty,
  businessId: uuid.optional(),
  q: z.string().optional(),
  filters: z.array(z.object({
    field: nonEmpty,
    operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains", "startsWith"]),
    value: z.unknown(),
  })).optional(),
  sort: z.array(z.object({
    field: nonEmpty,
    direction: z.enum(["asc", "desc"]),
  })).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const SaveSearchSchema = z.object({
  businessId: uuid.optional(),
  entity: nonEmpty,
  name: z.string().min(1).max(200),
  query: SearchQuerySchema.omit({ entity: true }),
  createdBy: uuid,
});

// ── Notification ──────────────────────────────────────────────────────────────

export const SendNotificationSchema = z.object({
  businessId: uuid.optional(),
  channel: z.enum(["sms", "email", "slack", "teams", "push", "voice", "internal"]),
  recipient: nonEmpty,
  subject: z.string().max(500).optional(),
  body: nonEmpty,
  templateKey: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpsertWorkflowSessionSchema = z.object({
  userId: uuid,
  currentStep: z.number().int().nonnegative(),
  completedSteps: z.array(z.number().int().nonnegative()).default([]),
  totalSteps: z.number().int().positive(),
  formData: z.record(z.unknown()).default({}),
  validationState: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

// ── Validation helpers ────────────────────────────────────────────────────────

/** Validate arbitrary data against a schema (non-HTTP context). */
export function validateData<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw Object.assign(new Error(`Validation failed: ${msg}`), { code: "VALIDATION_ERROR", statusCode: 400 });
  }
  return result.data as z.infer<S>;
}

/** Check without throwing — returns error messages or null. */
export function validateSafe<S extends z.ZodTypeAny>(schema: S, data: unknown): string[] | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    return result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  }
  return null;
}

// Re-export z for consumers
export { z };
