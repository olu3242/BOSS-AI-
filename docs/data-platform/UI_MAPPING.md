# BOSS UI Mapping

> Version: 1.0.0 | Pages, components, data sources, and required states

---

## Design System

- **Theme**: Dark only (no light mode)
- **Typography**: Syne (headings) + DM Sans (body)
- **Accent**: Red `#C8102E`
- **Component Library**: shadcn/ui + Tailwind CSS
- **Required states per page**: Loading (skeleton), Empty (actionable), Error (recoverable), Success, Partial

---

## App Shell

| Route | Page | Auth | Data |
|-------|------|------|------|
| `/` | Landing / Marketing | Public | Static |
| `/login` | Login | Public | Supabase Auth |
| `/onboarding` | Org + Business setup | Required | POST /v1/businesses |
| `/dashboard` | Main workspace | Required | GET /v1/businesses/:id/workspace |
| `/mission-control` | Mission Control | Required | GET /v1/businesses/:id/mission-control |

---

## Business Intelligence OS

| Route | Page | API Calls | States Required |
|-------|------|-----------|----------------|
| `/business/profile` | Business Profile | GET /profile, PATCH /profile | Loading, Empty (no profile yet), Error |
| `/business/mri` | MRI Session | GET /mri/:id/responses | Loading, In Progress, Completed |
| `/business/mri/start` | Start MRI | POST /mri/start | Loading, Error |
| `/business/health` | Health Dashboard | GET /health | Loading, Empty (no health generated), Score display |
| `/business/dna` | Business DNA | GET /dna | Loading, Empty (DNA not generated yet), Display |

### Health Dashboard Components

| Component | Data Source | Empty State |
|-----------|------------|-------------|
| `HealthScoreCard` | `business_health.overall_score` | "Run your first health analysis to see your score" + CTA |
| `DimensionRadar` | `business_health_dimensions` | Radar with all zeros + message |
| `HealthTrendChart` | `business_health[]` sorted by created_at | "Not enough data yet" |
| `CapabilityGrid` | `business_capabilities` | "No capabilities mapped yet" |

---

## Constraint Intelligence OS

| Route | Page | API Calls |
|-------|------|-----------|
| `/constraints` | Constraint List | GET /constraints |
| `/constraints/priorities` | Priority View | GET /constraints/priorities |
| `/constraints/:id` | Constraint Detail | GET /constraints/:id |

### Constraint Components

| Component | States |
|-----------|--------|
| `ConstraintCard` | active / monitoring / resolved / dismissed — color coded by severity |
| `SeverityBadge` | critical=red, high=orange, medium=yellow, low=blue, informational=gray |
| `ConfidenceBar` | 0–1 displayed as percentage |
| `ConstraintEmptyState` | "No constraints detected — your business is healthy or analysis hasn't run yet" + CTA to run analysis |

---

## Recommendation Intelligence OS

| Route | Page | API Calls |
|-------|------|-----------|
| `/recommendations` | Recommendation List | GET /recommendations |
| `/recommendations/roadmap` | Transformation Roadmap | GET /recommendations/roadmap |
| `/recommendations/:id` | Recommendation Detail | GET /recommendations/:id |
| `/recommendations/:id/approve` | Approve Modal | POST /recommendations/:id/approve |

### Recommendation Components

| Component | States |
|-----------|--------|
| `RecommendationCard` | proposed / approved / in_progress / completed / dismissed |
| `RoadmapTimeline` | Grouped by stage: quick_wins, short_term, medium_term, strategic, long_term |
| `ApprovalBadge` | auto=green, approval_required=yellow, executive_review=red, manual_only=gray |
| `EmptyRoadmap` | "No recommendations yet — complete your business analysis to see your transformation roadmap" |

---

## Decision & Scenario OS

| Route | Page | API Calls |
|-------|------|-----------|
| `/decisions` | Decision List | GET /decisions |
| `/decisions/:id` | Decision Detail | GET /decisions/:id/brief |
| `/decisions/:id/plan` | Execution Plan | GET /decisions/:id/plan |
| `/scenarios` | Scenario List | GET /scenarios |
| `/scenarios/forecast` | Forecast View | GET /scenarios/forecast |

### Decision Components

| Component | States |
|-----------|--------|
| `DecisionCard` | draft / pending_review / approved / executing / completed / archived |
| `OptionSelector` | Options with pros/cons; selected option highlighted |
| `ROIComparison` | expected_roi vs actual_roi bar chart |
| `ExecutionPlanTimeline` | Steps with status indicators |

---

## Customer & Sales OS

| Route | Page | API Calls |
|-------|------|-----------|
| `/customers` | Customer List | GET /customers?page=1&perPage=50 |
| `/customers/:id` | Customer Detail | GET /customers/:id |
| `/customers/new` | Create Customer | POST /customers |
| `/leads` | Lead Pipeline | GET /leads |
| `/leads/:id` | Lead Detail | GET /leads/:id |
| `/jobs` | Job Board | GET /jobs |
| `/jobs/:id` | Job Detail | GET /jobs/:id |
| `/appointments` | Calendar View | GET /appointments |
| `/invoices` | Invoice List | GET /invoices |
| `/invoices/:id` | Invoice Detail | GET /invoices/:id |
| `/invoices/new` | Create Invoice | POST /invoices |
| `/payments` | Payment History | GET /payments (finance role) |
| `/reviews` | Review Dashboard | GET /reviews |

### Customer Components

| Component | Data | Empty State |
|-----------|------|-------------|
| `CustomerTable` | customers[] | "No customers yet — add your first customer" |
| `CustomerHealthBadge` | health_score 0–100 | Gray if null |
| `RevenueTotal` | total_revenue | "$0.00" |
| `LeadKanban` | leads grouped by status | "No leads — start tracking your pipeline" |
| `AppointmentCalendar` | appointments by start_at | Empty calendar with "Book your first appointment" |
| `InvoiceStatusChip` | invoice.status | Color per status |

---

## KPI & Goals OS

| Route | Page | API Calls |
|-------|------|-----------|
| `/kpis` | KPI Dashboard | GET /kpis |
| `/kpis/:key` | KPI Detail | GET /kpis/:key |
| `/goals` | Goals Tracker | GET /goals |
| `/briefings` | Executive Briefings | GET /briefings |
| `/briefings/:period` | Briefing Detail | GET /briefings/:period |

### KPI Components

| Component | States |
|-----------|--------|
| `KpiTile` | value, unit, trend indicator (up/down/flat), target range |
| `KpiSparkline` | 30-day trend from kpi_readings |
| `GoalProgressBar` | 0–100% toward goal target |
| `BriefingCard` | Period, summary, top 3 actions, health delta |
| `EmptyKpis` | "No KPI data yet — your AI employees will populate these as they work" |

---

## Integration & Tool OS

| Route | Page | API Calls |
|-------|------|-----------|
| `/integrations` | Integration Hub | GET /tools/providers |
| `/integrations/marketplace` | Marketplace | Static + GET /tools/providers |
| `/tools/history` | Tool Execution Log | GET /tools/... |
| `/workflows` | Workflow Monitor | GET /workflow_executions |
| `/workflows/:id` | Execution Detail | GET /workflow_executions/:id |

---

## Workspace & Approvals

| Route | Page | API Calls |
|-------|------|-----------|
| `/workspace` | Main Workspace | GET /workspace |
| `/workspace/approvals` | Pending Approvals | GET /workspace/approvals |
| `/mission-control` | Mission Control | GET /mission-control |

### Workspace Components

| Component | Data | Empty State |
|-----------|------|-------------|
| `ApprovalQueue` | PendingApproval[] | "No pending approvals" |
| `HealthSummaryWidget` | business_health | Skeleton → score card |
| `ActiveConstraintList` | constraint_instances (active) | "No active constraints" |
| `RecommendationHighlights` | Top 3 proposed recommendations | "Run analysis to see recommendations" |
| `KpiSummaryRow` | Top 5 KPIs by employee priority | Loading skeleton (3 tiles) |

---

## Global UI Requirements

### Every Page Must Have

| State | Implementation |
|-------|---------------|
| Loading | `<Skeleton>` components matching layout; no spinners |
| Empty | Actionable copy + primary CTA button; icon illustration |
| Error | "Something went wrong" + error message + "Try again" button |
| Success | Toast notification + updated UI state (no full page refresh) |
| Partial | Show loaded data; skeletonize missing sections |

### Navigation

| Element | Behavior |
|---------|---------|
| Sidebar | Collapsible; active state per route |
| Breadcrumbs | On all detail pages |
| Page titles | Match entity name; update document.title |
| Back button | Browser back or explicit `←` link |

### Realtime Updates

| Entity | Realtime Channel | Update Trigger |
|--------|-----------------|---------------|
| `workflow_executions` | `workflow:${businessId}` | status change |
| `recommendation_instances` | `recommendations:${businessId}` | status change |
| `constraint_instances` | `constraints:${businessId}` | new constraint analyzed |
| `notification_deliveries` | `notifications:${orgId}` | new delivery |
| `business_health` | `health:${businessId}` | new health record |

Realtime uses Supabase Realtime channels (Postgres change events).
