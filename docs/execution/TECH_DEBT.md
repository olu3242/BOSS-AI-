# Technical Debt Register

Track debt explicitly instead of letting it hide in TODO comments.
Each entry should be small enough to become a single PR.

| ID | Description | Introduced | Severity | Owner | Status |
|----|--------------|-----------|----------|-------|--------|
| TD-001 | ~~`apps/web` is a placeholder TS entrypoint, not a real Next.js app~~ — narrowed Goal 14: `apps/web` is now a real Next.js 14 App Router app with a working Business Setup → Mission Control slice, but MRI/DNA/Health/Constraints/Recommendations views still don't exist (see TD-029) | Goal 0 | Medium | unassigned | narrowed |
| TD-002 | ~~`apps/api` has typed services/controllers (Goal 2) but no HTTP transport (Express/Fastify/Next route handlers) wired up yet~~ — resolved Goal 13 (`apps/api/src/http/server.ts`) | Goal 0 | High | unassigned | resolved |
| TD-003 | Database/Supabase wiring implemented for the Business Intelligence Layer only (Goal 2); the rest of `docs/architecture/ARCHITECTURE.md` §6 schema is not implemented | Goal 0 | High | unassigned | open |
| TD-004 | `packages/ui`, `packages/loop`, `packages/events` are typed interfaces only, no runtime implementation (`packages/mcp` gained real derivation logic in Goal 2) | Goal 0 | Medium | unassigned | open |
| TD-005 | Registries are in-memory only — no persistence, no admin UI to edit entries | Goal 0.5 | Medium | unassigned | open |
| TD-006 | ~~No auth — CI and local dev have no permission boundary yet~~ — narrowed Goal 15: the API now verifies signed JWTs (`apps/api/src/http/auth.ts`), but there is still no real login UI, no `organizations`/`users` schema, and no Supabase Auth project (see TD-030) | Goal 0 | Medium | unassigned | narrowed |
| TD-007 | Business DNA/Health/Capability derivation in `packages/mcp` is deterministic rule-based logic, explicitly not AI inference — Goal 2 forbids AI here; a later goal should decide if/how to layer LLM reasoning on top | Goal 2 | Medium | unassigned | open |
| TD-008 | `packages/db` repositories enforce `org_id` scoping in application-level WHERE clauses, not Postgres row-level security policies | Goal 2 | Medium | unassigned | open |
| TD-009 | Constraint Graph relationship (`constraint_relationships`) and history (`constraint_history`) tables are persisted but not yet exposed through any API read path | Goal 3 | Medium | unassigned | open |
| TD-010 | Capability pack installation is hardcoded to `general-smb` inside `apps/api`'s container — no runtime-configurable pack selection for multiple verticals yet | Goal 3 | Medium | unassigned | open |
| TD-011 | Transformation Roadmap and Approval Model (`auto`/`approval_required`/`executive_review`/`manual_only`) are persisted but not consumed by any runtime yet — reserved for a future Loop Runtime | Goal 4 | Medium | unassigned | open |
| TD-012 | `recommendation_instances.dependencies` is a flat `jsonb` array, not a dedicated relationship table — unlike constraints, which got `constraint_relationships` in Goal 3 | Goal 4 | Low | unassigned | open |
| TD-013 | ~~`executeToolRequestSimulated()` is the only Execution Adapter~~ — narrowed Super Batch A: Twilio, MessageBird, Gmail, Microsoft 365, Slack, and Teams now have real production adapters; 13 of 19 registered providers still use the simulated fallback. Generic registry-driven dispatch is blocked on provider/tool registry entries lacking endpoint/HTTP-method metadata | Goal 8 | Medium | unassigned | narrowed |
| TD-014 | ~~`CredentialReference.secretRef` is a schema for a pointer only~~ — narrowed Super Batch A: `SecretStore` abstraction now exists with `EnvSecretStore` and `EncryptedInMemorySecretStore` (AES-256-GCM); still no external KMS (Vault, AWS Secrets Manager) backing, no cross-process durability, no TTL sweeper — deferred to Super Batch B / Goal 17 | Goal 8 | High | unassigned | narrowed |
| TD-015 | `ToolDefinitionEntry.rateLimitPerMinute` and `PermissionPolicy.rateLimitPerMinute` are declared but not enforced anywhere at execution time | Goal 8 | Medium | unassigned | open |
| TD-016 | No Integration Center / Connection Wizard UI exists to let a business owner actually connect (OAuth) a provider — `connectIntegration()` is API-only | Goal 8 | Medium | unassigned | open |
| TD-017 | ~~Loop Runtime has no real scheduler~~ — resolved Goal 17: `SchedulerService` with immediate/delayed/cron/recurring triggers; `scheduler_jobs` table + `runDue()` poll-and-execute dispatch | EP-1 Batch 5 prereq | High | unassigned | resolved |
| TD-018 | ~~`timed_out` state never transitioned~~ — resolved Goal 17: `timeoutMs` on `StepSpec`, `Promise.race` in Loop Runtime; timed-out tasks transition to `timed_out` and are dead-lettered | EP-1 Batch 5 prereq | Medium | unassigned | resolved |
| TD-019 | ~~Loop Runtime strictly sequential~~ — resolved Goal 17: `ParallelStepGroup` type; `StepEntry = StepSpec | ParallelStepGroup`; parallel groups run via `Promise.all` with rollback on failure | EP-1 Batch 5 prereq | Medium | unassigned | resolved |
| TD-020 | Loop Runtime has no dedicated `execution_metrics` table — `scheduler_jobs` (Goal 17) serves as scheduling record; dedicated metrics table still deferred | EP-1 Batch 5 prereq | Low | unassigned | narrowed |
| TD-021 | Canonical domain events (`business.mri.*`, `business.health.*`, `business.constraints.*`, `business.recommendations.*`, `tool.execution.*`) are live pub/sub only via the in-memory `EventBus` — no durable domain-event log, no cross-process delivery, no replay; a process restart drops all subscriptions | Goal 9 | Medium | unassigned | open |
| TD-022 | `BusinessRecommendation.relatedCapabilities` is not guaranteed to map 1:1 onto registered tool capabilities (some entries are category-like labels) — the autonomous workflow generator produces one "tool" step per entry with no upstream validation, so unresolvable capabilities deterministically fail at execution time rather than at generation time | Goal 10 | Medium | unassigned | open |
| TD-023 | All seeded `general-smb` AI employee archetypes have `lifecycle: "draft"`, so the new "ai" task handler will escalate every real task against them rather than execute — no employee can be promoted to `"available"` without a future admin/lifecycle-management capability | Goal 11 | Medium | unassigned | open |
| TD-024 | The AI Employee runtime's "ai" task handler resolves whether an employee *may* invoke a capability, but performs no actual AI/LLM inference — `AIEmployee.inputs`/`outputs` schemas, `policies`, and real reasoning (Claude API) from CLAUDE.md's contract are not yet implemented | Goal 11 | High | unassigned | open |
| TD-025 | `memory_records` has no expiry sweeper — `expires_at` is persisted but nothing reads it to purge or ignore expired rows | Goal 11 | Low | unassigned | open |
| TD-026 | `missionControlService.getSnapshot()` returns full unbounded history (all workflows/tasks/events/dead letters/timeline entries) for a business — no pagination or time-windowing | Goal 12 | Medium | unassigned | open |
| TD-027 | ~~`apps/api`'s HTTP transport reads tenancy from a raw `x-org-id` header instead of a verified JWT~~ — resolved Goal 15 (`apps/api/src/http/auth.ts` verifies a signed JWT and extracts `org_id` from its claims) | Goal 13 | High | unassigned | resolved |
| TD-028 | HTTP transport has no input validation (Zod or otherwise) on request bodies — malformed bodies are passed straight into service methods and fail however the underlying service happens to fail, not with a clean 400 | Goal 13 | Medium | unassigned | open |
| TD-029 | `apps/web` only covers a thin Business Setup → Mission Control vertical slice — MRI, DNA, Health, Constraints, and Recommendations have no pages yet, and `packages/ui` (TD-004) is not integrated since these pages use plain Tailwind classes | Goal 14 | Medium | unassigned | open |
| TD-030 | JWT verification is real (TD-027 resolved), but token *issuance* is a dev-only placeholder: `POST /api/v1/auth/dev-token` mints a signed token for any `org_id` the caller asks for, with no real login UI, no `organizations`/`users` schema, and no Supabase Auth project; the route is disabled when `NODE_ENV=production` but a real auth/signup flow must replace it before launch | Goal 15 | High | unassigned | open |

## Process

- Add an entry when you knowingly cut a corner — link the PR that
  introduced it.
- Resolve by opening a PR that closes the entry and removes the row (or
  moves it to "resolved" history below if worth keeping for context).
- Review this file at the start of every new Goal; debt blocking the
  next goal must be paid down first.
