/**
 * Client-side validation schemas for onboarding and auth forms.
 * Mirrors the shape of the API's Zod schemas so both layers enforce
 * the same rules without sharing a package boundary.
 */
import { z } from "zod";

// ─── Primitives ──────────────────────────────────────────────────────────────

const email = z.string().min(1, "Email is required.").email("Enter a valid email address.");
const password = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.");

// ─── Auth ────────────────────────────────────────────────────────────────────

export const SignUpSchema = z.object({
  email,
  password,
});

export const SignInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export const ForgotPasswordSchema = z.object({
  email,
});

export const ResetPasswordSchema = z
  .object({
    password,
    confirmation: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirmation, {
    message: "Passwords do not match.",
    path: ["confirmation"],
  });

// ─── Organization ─────────────────────────────────────────────────────────────

export const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required.")
    .min(2, "Organization name must be at least 2 characters.")
    .max(100, "Organization name cannot exceed 100 characters.")
    .regex(/\S/, "Organization name cannot be blank."),
});

// ─── Business onboarding wizard ───────────────────────────────────────────────

export const WizardStep1Schema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required.")
    .min(2, "Business name must be at least 2 characters.")
    .max(100, "Business name cannot exceed 100 characters.")
    .regex(/\S/, "Business name cannot be blank."),
  industry: z.string().min(1, "Please select your industry."),
});

export const WizardStep2Schema = z.object({
  businessType: z.string().min(1, "Business structure is required."),
  employeeCount: z.coerce
    .number({ invalid_type_error: "Enter a number." })
    .int("Must be a whole number.")
    .positive("Must be at least 1."),
  locationCount: z.coerce
    .number({ invalid_type_error: "Enter a number." })
    .int("Must be a whole number.")
    .positive("Must be at least 1."),
  annualRevenue: z.coerce
    .number({ invalid_type_error: "Enter a number." })
    .nonnegative("Cannot be negative."),
  yearsOperating: z.coerce
    .number({ invalid_type_error: "Enter a number." })
    .int("Must be a whole number.")
    .nonnegative("Cannot be negative."),
});

export const WizardStep3Schema = z.object({
  openDays: z.array(z.string()).min(1, "Select at least one day."),
  openTime: z.string().min(1, "Opening time is required."),
  closeTime: z.string().min(1, "Closing time is required."),
});

export const WizardStep6Schema = z.object({
  aiAgents: z.array(z.string()).min(1, "Select at least one AI employee to activate."),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the first validation error for a field, or null. */
export function fieldError<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  field: string,
): string | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  const err = result.error.errors.find((e) => e.path[0] === field);
  return err?.message ?? null;
}

/** Returns a map of field → first error message. */
export function allErrors<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const map: Record<string, string> = {};
  for (const err of result.error.errors) {
    const key = err.path.join(".");
    if (!map[key]) map[key] = err.message;
  }
  return map;
}
