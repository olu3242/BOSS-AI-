# BOSS V3 — Business Context Certification

**Date:** 2026-07-24  
**Status:** PASS

---

## Bounded Context: Business

The Business context owns the business entity, its profile (DNA), health score, and all sub-resources (customers, jobs, invoices, appointments, workforce, workflows).

---

## Domain Model

```typescript
// Core entity
interface Business {
  id: string;
  orgId: string;
  name: string;
  industry: Industry;
  status: "active" | "archived";
  profile: BusinessProfile;
  healthScore: number;        // 0–100, computed by MRI
  lastMriAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;   // soft delete
}

// Profile (captured during onboarding)
interface BusinessProfile {
  businessType: string;
  employeeCount: string;
  annualRevenue: string;
  yearsInOperation: string;
  locationCount: string;
  operatingHours: OperatingHours;
  services: string;
  toolStack: string[];
  aiWorkforce: string[];
}
```

---

## Industry Registry

9 supported industries (hardcoded registry, not DB table):

| ID | Label |
|---|---|
| `home_services` | Home Services |
| `retail` | Retail |
| `restaurant` | Restaurant / Food Service |
| `healthcare` | Healthcare / Medical |
| `professional_services` | Professional Services |
| `fitness_wellness` | Fitness & Wellness |
| `automotive` | Automotive |
| `beauty_personal_care` | Beauty & Personal Care |
| `general_smb` | General Small Business (fallback) |

---

## API Surface

All routes require `requireOrgId`. Tenant isolation enforced at API boundary — `org_id` from JWT, never from request body.

| Route | Method | Status |
|---|---|---|
| `/api/v1/businesses` | POST | ✅ Create business |
| `/api/v1/businesses` | GET | ✅ List by org |
| `/api/v1/businesses/:id` | GET | ✅ Get by ID (org-scoped) |
| `/api/v1/businesses/:id` | PATCH | ✅ Update profile |
| `/api/v1/businesses/:id/health` | GET | ✅ Health score + alerts |
| `/api/v1/businesses/:id/health-summary` | GET | ✅ Dashboard summary |
| `/api/v1/businesses/:id/mri` | GET | ✅ Latest MRI |
| `/api/v1/businesses/:id/mri` | POST | ✅ Trigger MRI |
| `/api/v1/businesses/:id/dna` | GET | ✅ Business DNA |
| `/api/v1/businesses/:id/recommendations` | GET | ✅ Ranked actions |
| `/api/v1/businesses/:id/customers` | GET/POST | ✅ |
| `/api/v1/businesses/:id/jobs` | GET/POST | ✅ |
| `/api/v1/businesses/:id/invoices` | GET/POST | ✅ |
| `/api/v1/businesses/:id/appointments` | GET/POST | ✅ |
| `/api/v1/businesses/:id/workforce` | GET | ✅ Available agents |
| `/api/v1/businesses/:id/workforce/:id/run` | POST | ✅ Run agent |
| `/api/v1/businesses/:id/workflows` | GET/POST | ✅ |

---

## Domain Events

| Event | Trigger | Status |
|---|---|---|
| `business.created` | After `POST /api/v1/businesses` | ✅ |
| `business.updated` | After `PATCH /api/v1/businesses/:id` | ✅ |
| `business.health_updated` | After MRI completion | ✅ |

---

## Multi-Tenancy

| Control | Implementation | Status |
|---|---|---|
| `org_id` source | JWT claim only | ✅ |
| List scoping | All queries filter `WHERE org_id = $1` | ✅ |
| Get by ID | Verifies `business.org_id === jwt.org_id` | ✅ |
| Create | `org_id` injected from JWT, not body | ✅ |
| RLS | PostgreSQL policies on `businesses` table | ✅ |

---

## Certification Decision

**PASS.** Business context is correctly bounded. All 20+ API routes are implemented with proper auth and tenant isolation. Domain events are emitted. Multi-tenancy is enforced at both API and database level.
