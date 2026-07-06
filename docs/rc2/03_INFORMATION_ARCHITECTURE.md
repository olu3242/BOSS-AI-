# RC2 — Information Architecture

---

## Site Map

```
/                          ← Marketing (Project Renaissance)
├── /pricing
├── /industries
├── /about
└── /auth/sign-in

/dashboard                 ← Authenticated: org-level overview
/businesses                ← Business list
/business/[id]/
├── /health                ← Business Health Score
└── /workspace/
    ├── /decisions         ← Decision Center
    ├── /scenarios         ← Scenario Planning
    ├── /workflows         ← Workflow Visualization
    ├── /jobs              ← Job Management
    ├── /appointments      ← Appointment Scheduling
    ├── /invoices          ← Invoice Management
    ├── /payments          ← Payment Tracking
    ├── /reviews           ← Customer Reviews
    └── /analytics         ← Business Analytics
```

## Navigation Zones

### Zone 1 — Marketing Nav (unauthenticated `/`)
- Logo
- Features | Industries | Pricing | About
- Sign In | Get Started (CTA)

### Zone 2 — App Nav (authenticated)
- Logo + Org switcher
- Dashboard | Businesses
- User menu

### Zone 3 — Workspace Sidebar (per-business)
- Back to Businesses
- Health Score
- Decisions | Scenarios | Workflows
- ─── Operations ───
- Jobs | Appointments | Invoices | Payments | Reviews | Analytics

## Page-Level Requirements

Every page implements:
1. **Loading** — Skeleton layout (not spinner)
2. **Empty** — Actionable copy + CTA (not just "No items found")
3. **Error** — What happened + how to recover
4. **Success** — Confirmation + next action
5. **Partial** — Show what loaded, indicate what's missing
