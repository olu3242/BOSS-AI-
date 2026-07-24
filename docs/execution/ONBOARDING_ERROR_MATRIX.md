# BOSS V3 — Onboarding Error Matrix

**Date:** 2026-07-24  
**Status:** CERTIFIED

---

## Error Classification

| Severity | Code Pattern | User Message | Retry Guidance |
|---|---|---|---|
| Validation | VALIDATION_* | Field-specific (see below) | Correct input and resubmit |
| Auth | AUTH_* | Generic safe message | Try again or reset password |
| Network | NETWORK_* | Connection message | Check connection and retry |
| API | API_* | Service message | Retry; contact support if persists |
| Database | DB_* | Generic failure message | Retry; contact support if persists |
| Unknown | UNKNOWN | Generic failure message | Retry; contact support if persists |

---

## Auth Errors

| Scenario | Old Error (leaked) | New Error (sanitized) | Code |
|---|---|---|---|
| Duplicate email | "User already registered" (Supabase raw) | "An account with this email already exists." | AUTH_EMAIL_TAKEN |
| Invalid credentials | "Invalid login credentials" (Supabase raw) | "Invalid email or password." | AUTH_INVALID_CREDENTIALS |
| Weak password | Supabase password policy message | "Password is too weak. Use at least 8 characters." | AUTH_WEAK_PASSWORD |
| Empty email | (HTML5 only) | "Email is required." | VALIDATION_REQUIRED |
| Invalid email format | (HTML5 only) | "Enter a valid email address." | VALIDATION_FORMAT |
| Empty password | (HTML5 only) | "Password is required." | VALIDATION_REQUIRED |
| Password too short | (HTML5 minLength) | "Password must be at least 8 characters." | VALIDATION_MIN_LENGTH |
| Network failure | (unhandled) | "Sign-up failed. Please try again." | NETWORK_ERROR |

---

## Organization Creation Errors

| Scenario | Old Error | New Error | Code |
|---|---|---|---|
| Empty name | (OrganizationRuntime throw) | "Organization name is required." | VALIDATION_REQUIRED |
| Name < 2 chars | (OrganizationRuntime throw) | "Organization name must be at least 2 characters." | VALIDATION_MIN_LENGTH |
| Name > 100 chars | (OrganizationRuntime throw) | "Organization name cannot exceed 100 characters." | VALIDATION_MAX_LENGTH |
| Blank (whitespace) | (OrganizationRuntime throw) | "Organization name cannot be blank." | VALIDATION_BLANK |
| Service failure | Error message exposed | "Organization creation failed. Please try again." | API_ERROR |

---

## Onboarding Wizard Errors

### Step 1 — Business & Industry

| Scenario | Error Message | Location |
|---|---|---|
| Business name empty | "Business name is required." | Inline below field |
| Business name < 2 chars | "Business name must be at least 2 characters." | Inline below field |
| Business name > 100 chars | "Business name cannot exceed 100 characters." | Inline below field |
| No industry selected | "Please select your industry." | Inline below grid |

### Step 2 — Profile

| Scenario | Error Message | Location |
|---|---|---|
| Employees < 1 | "Must be at least 1." | Inline below field |
| Locations < 1 | "Must be at least 1." | Inline below field |
| Revenue negative | "Cannot be negative." | Inline below field |
| Years negative | "Cannot be negative." | Inline below field |
| Non-numeric input | "Enter a number." | Inline below field |

### Step 3 — Hours

| Scenario | Error Message | Location |
|---|---|---|
| No days selected | "Select at least one day." | Inline below day grid |
| Missing open time | "Opening time is required." | Inline below field |
| Missing close time | "Closing time is required." | Inline below field |

### Step 6 — AI Workforce

| Scenario | Error Message | Location |
|---|---|---|
| No agents selected | "Select at least one AI employee to activate." | Inline below agent grid |

### Business Creation (API)

| Scenario | Error Message | Location |
|---|---|---|
| ApiClientError with message | `err.body.message` (structured) | Banner above nav |
| Network / unknown failure | "Unable to create your business. Please check your connection and try again." | Banner above nav |

---

## Error Display Standards

- All field errors appear immediately below their field with `role="alert"` for accessibility
- All form-level errors appear in a banner with `role="alert"`
- No stack traces are ever returned to the client
- No provider-internal error messages are exposed to users
- Correlation IDs (`traceId`) are included in all API error responses for support escalation

---

## Forbidden Patterns (Eliminated)

```
❌ "Something went wrong."
❌ "An unexpected error occurred."
❌ "Error: User already registered"
❌ "Invalid login credentials"
❌ Raw stack trace in API response
❌ Supabase internal error codes in UI
```
