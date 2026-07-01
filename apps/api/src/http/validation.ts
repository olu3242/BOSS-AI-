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
  annualRevenue: z.number().positive(),
  businessType: z.string().min(1),
  yearsOperating: z.number().int().nonnegative(),
  locationCount: z.number().int().positive().default(1),
  businessHours: z.string().default("Mon-Fri 9am-5pm"),
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

