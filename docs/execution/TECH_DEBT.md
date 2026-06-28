# Technical Debt Register

Track debt explicitly instead of letting it hide in TODO comments.
Each entry should be small enough to become a single PR.

| ID | Description | Introduced | Severity | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| TD-001 | Browser identity callbacks, protected routes, organization selection, and persisted sessions were missing | Goal 0 | High | unassigned | resolved in OC1 Wave A |
| TD-002 | `apps/api` has typed services/controllers and a health server but no production HTTP transport exposing all operations | Goal 0 | High | unassigned | open |
| TD-003 | Database/Supabase wiring covers business intelligence; the remaining architecture schema is not implemented | Goal 0 | High | unassigned | open |
| TD-004 | Loop and Events have tested in-memory runtimes; durable stores, distributed workers, leases, and production event transport remain open | Runtime RIP | High | unassigned | partially mitigated |
| TD-005 | Registries are in-memory only; there is no persistence or administration UI | Goal 0.5 | Medium | unassigned | open |
| TD-006 | Provider-backed browser identity is implemented and locally tested; deployed Supabase, email, HTTPS, and live RLS certification remain external | Runtime RIP | High | unassigned | environmentally blocked |
| TD-007 | Business DNA/Health/Capability derivation is deterministic rule-based logic; model reasoning requires a separately governed provider decision | Goal 2 | Medium | unassigned | open |
| TD-008 | Repositories enforce `org_id` in application queries rather than certified Postgres RLS policies | Goal 2 | High | unassigned | open |
| TD-009 | Constraint relationships and history are persisted but not exposed through an API read path | Goal 3 | Medium | unassigned | open |
| TD-010 | Capability-pack installation is hardcoded to `general-smb` in the API container | Goal 3 | Medium | unassigned | open |
| TD-011 | Loop supports approval steps, but recommendation approval modes are not mapped into executable workflow policies | Runtime RIP | Medium | unassigned | partially mitigated |
| TD-012 | `recommendation_instances.dependencies` is a JSON array rather than a dedicated relationship table | Goal 4 | Low | unassigned | open |
| TD-013 | Awaiting workflow approvals have no persisted resume/cancel API | Runtime RIP | High | unassigned | open |
| TD-014 | Runtime telemetry has no OpenTelemetry exporter, production sink, dashboard, alerting, or SLO | Runtime RIP | High | unassigned | open |
| TD-015 | Scheduler execution depends on in-process `tick()` and has no distributed lease or clock-skew handling | Runtime RIP | High | unassigned | open |
| TD-016 | Canonical Business Context migration `0012` and RLS pass static tests but lack live PostgreSQL evidence | Epic 2 / Discovery | High | unassigned | environmentally blocked |
| TD-017 | Business Knowledge Graph migration `0013`, composite tenant foreign keys, and RLS pass static tests but lack live PostgreSQL evidence | Epic 2 / Knowledge Graph | High | unassigned | environmentally blocked |
| TD-018 | Graph Runtime cache invalidation is process-local; horizontal deployment requires broker delivery to every runtime or a shared cache | Epic 2 / Knowledge Graph Runtime | High | unassigned | open |
| TD-019 | Semantic Context and view caches are process-local; horizontal deployment requires broker-backed invalidation or a shared version-aware cache | Epic 2 / Semantic Layer | High | unassigned | open |
| TD-020 | BQIL query, projection, and context caches are process-local; horizontal deployment requires broker-backed invalidation or a shared version-aware cache | Epic 2 / BQIL | High | unassigned | open |
| TD-021 | Legacy command-center reads predate BQIL and remain for backward compatibility; new Business Knowledge Platform consumers must use BQIL | Epic 2 / BQIL | Medium | unassigned | open |
| TD-022 | Capability Pack releases, tenant installations, audit history, and trust keys default to process-local stores | Phase B / CPP | High | unassigned | open |
| TD-023 | Capability Pack modules are trusted in-process descriptors without artifact isolation, resource limits, malware scanning, or distributed loading | Phase B / CPP | High | unassigned | open |
| TD-024 | Business Capability bundles, top-level registry, lifecycle gate enforcement, and Decision Ledger integration are adopted architecture but not implemented | Enterprise Architecture v2 | High | unassigned | planned |

## Process

- Add an entry when knowingly accepting a limitation.
- Resolve debt through a focused change with executable validation.
- Review this file before each new program increment.
