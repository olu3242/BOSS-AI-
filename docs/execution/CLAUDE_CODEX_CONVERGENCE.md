# Claude-Codex Convergence

Certification date: 2026-06-27

## Executive Summary

Remote refs were refreshed before comparison. The only discovered Claude
branch is:

`origin/claude/boss-repo-normalization-n1jdx5`

It points to commit `1eba345`, which is also the current committed `HEAD`.
Codex changes are layered on that exact tree. No committed Claude file is
deleted by the working tree.

- **Discovered source convergence: 100%**
- **Implemented Claude capabilities retained: 100%**
- **Operational product maturity: approximately 28%**

Convergence percentage measures preservation of the discovered implementations.
It does not mean the planned platform or runtime is complete.

## Comparison Method

Evidence included:

- Refreshed local and remote branch inventory
- `git diff origin/main..origin/claude/boss-repo-normalization-n1jdx5`
- `git diff HEAD` for Codex working-tree extensions
- Commit history and package boundaries
- Existing and affected tests
- Typecheck, lint, test, build, and architecture checks

Implementations were compared by contracts, behavior, tests, security,
maintainability, and production evidence rather than file size.

## Capability Matrix

| Subsystem | Classification | Winner | Rationale and evidence |
| --- | --- | --- | --- |
| Monorepo architecture | Claude only | Claude | Claude established pnpm/Turbo packages, boundaries, CI, ADRs, standards, and ownership. Retained unchanged. |
| Domain ontology | Claude only | Claude | The shared business ontology remains the broadest typed domain model. |
| Database and migrations | Claude only | Claude | Seven migrations, in-memory/Postgres repositories, tenant-scoped queries, and tests are retained unchanged. |
| MCP intelligence | Claude only | Claude | Business DNA, health, capability, constraint, and recommendation engines remain the strongest deterministic implementation. |
| API services/controllers | Both, Codex complementary | Hybrid | Claude service/controller architecture is retained; Codex adds container injection, in-memory construction, health, security, and observability utilities. |
| Web application | Both, Codex superior | Hybrid | Claude landing assets are retained; Codex replaces the placeholder dev entry with a buildable Next.js App Router command center and tests. |
| Shared UI utilities | Codex only | Codex | Formatting, score tones, priority tones, and tests replace the empty UI package surface. |
| AI employee definitions | Claude only | Claude | Seven names, missions, prompts, KPIs, permissions, and escalation rules remain authoritative inputs. |
| Agent registry | Both, Codex superior | Hybrid | Claude definitions feed Codex's readonly normalized metadata, lifecycle, ownership, references, and validation. |
| Capability registry | Both, Codex superior | Hybrid | Claude's 15 IDs remain unchanged; Codex adds normalized metadata, ownership, risk, versioning, and readonly snapshots. |
| Workflow registry | Both, Codex superior | Hybrid | Claude's six workflow IDs and business links remain; Codex adds owners, agent/capability/prompt/event/trigger references and governance metadata. |
| Event registry | Both, Codex superior | Hybrid | Claude's 20 canonical events remain; Codex adds normalized ownership, category, risk, and publisher/subscriber indexes. |
| Automation | Codex metadata only | Codex | A readonly registry exists but is intentionally empty because neither implementation contains an automation runtime. |
| Runtime | Both, Codex superior | Hybrid | Claude supplied Loop/EventBus contracts; Codex adds executable internal-alpha identity, agent, workflow, event, queue, scheduler, and observability runtimes. |
| Dependency graph | Codex only | Codex | Readonly 97-node/109-edge graph, indexes, static analysis, and impact models. |
| Governance | Codex only | Codex | Policies, lifecycle controls, ownership matrix, audit metadata, and evidence-based readiness scoring. |
| Dashboard | Both, Codex superior | Hybrid | Claude supplied product/landing concepts; Codex supplies the actual internal-alpha page and dashboard registration. |
| Feature catalog | Newly harmonized | Hybrid | Existing Claude intelligence and Codex dashboard/registry capabilities are now registered by stable IDs. |
| Documentation | Both, complementary | Hybrid | Claude ADR/architecture foundation and Codex execution/certification evidence serve different purposes and are both retained. |
| Tests | Both, complementary | Hybrid | Claude business intelligence/database/MCP tests remain; Codex adds web, UI, production-utility, registry, graph, and governance coverage. |
| Configuration | Both, complementary | Hybrid | Claude workspace/Turbo setup remains; Codex aligns Next.js, pnpm 11, combined dev startup, and explicit esbuild build policy. |

## Capabilities Retained from Claude

- Production-shaped pnpm/Turbo monorepo and dependency boundaries
- Business ontology and shared domain types
- General-SMB capabilities, constraints, KPIs, prompts, workflows, policies,
  events, and AI employee definitions
- Deterministic MCP intelligence engines
- API business services and controllers
- In-memory and Postgres repositories
- Migrations and seed data
- Loop and EventBus contracts
- Landing-page assets, ADRs, architecture documentation, and engineering rules
- Business-intelligence, MCP, database, migration, and capability-pack tests

## Capabilities Retained from Codex

- Next.js App Router command center, loading state, error boundary, and tests
- Injectable and in-memory API construction
- Development health server and environment checks
- Tenant/RBAC, audit, logging, metric, and trace utilities
- Shared UI formatting and status utilities
- Normalized readonly agent, capability, workflow, event, trigger,
  automation, orchestrator, policy, governance, and lifecycle registries
- Dependency graph, reference indexes, impact analysis, ownership, and
  certification reports

## Newly Harmonized

- `featureRegistry` registers the existing business intelligence, executive
  command center, and registry architecture capabilities.
- `dashboardRegistry` registers the existing `/` command center as
  internal-alpha.
- `runtimeRegistry` activates seven tested internal-alpha runtime components.
- The pnpm esbuild policy is explicitly allowed.
- The unused `concurrently` dependency was removed, and environment
  documentation now names the actual `scripts/dev.ps1` runner.

## Registry Verification

| Registry | Entries | Status |
| --- | ---: | --- |
| Agent | 7 | Complete for discovered AI employees |
| Workflow | 6 | Complete for discovered workflow definitions |
| Event | 20 | Complete for discovered canonical events |
| Automation | 0 | Typed; no definitions discovered |
| Runtime | 7 | Internal-alpha components registered and tested |
| Dashboard | 1 | Existing command center registered |
| Feature | 3 | Existing implemented capability groups registered |

All populated registry IDs are unique. Existing names and compatibility
`key`/`label` contracts remain available.

## Runtime Verification

| Capability | Result |
| --- | --- |
| Agent execution | Internal-alpha injected runtime |
| Workflow execution | Internal-alpha persisted-state interface and in-memory store |
| Automation execution | In-memory queue, worker, scheduler, retry, DLQ, replay |
| Event routing | Context-enforced in-memory event bus |
| Queue processing | Single-process internal-alpha worker |
| Dashboard updates | Deterministic in-memory/demo snapshot; no live stream |
| Logging/metrics/tracing | Tested utilities; no production sink |
| Runtime health | Lifecycle, queue, dead-letter, active-agent, and active-workflow diagnostics |

Runtime behavior is executable but still requires durable and distributed
production adapters.

## Architectural Decisions

1. Preserve Claude's bounded-context and registry-driven architecture.
2. Keep legacy registry IDs and public `register/list/get` methods.
3. Layer normalized readonly metadata over Claude definitions rather than
   duplicating catalogs.
4. Retain Claude service/repository implementations and extend construction
   through dependency injection.
5. Keep landing assets while making the Next.js application the web runtime.
6. Represent absent runtime areas with empty typed registries.
7. Require authentication and tenant-boundary certification before runtime
   adoption.

## Files

### Added During Convergence

- Feature, dashboard, and runtime registry contracts
- Platform catalog seeds
- This convergence report

### Modified During Convergence

- Registry exports and core seeding
- General-SMB registry tests
- pnpm dependency/build policy
- Environment documentation

### Deprecated or Removed

- Unused `concurrently` development dependency
- Placeholder-only web startup behavior, while preserving the compatibility
  export module

No Claude source file was deleted.

## Compatibility

- Claude commit history remains the direct ancestor of all current work.
- Existing AI employee, capability, workflow, event, KPI, prompt, constraint,
  and recommendation IDs are unchanged.
- Existing API service/controller and repository exports remain available.
- The web package now uses Next.js scripts, while `src/index.ts` remains an
  export-compatible module.
- Empty runtime/automation registries make absence queryable without claiming
  implementation.

## Validation

| Gate | Result |
| --- | --- |
| Remote refresh | Passed; Claude ref remains at current `HEAD` |
| Typecheck | 20/20 Turbo tasks passed |
| Lint | 20/20 Turbo tasks passed |
| Tests | 20/20 Turbo tasks passed; 41 executable assertions passed |
| Build | 11/11 build tasks passed; Next.js production route generated |
| Architecture boundaries | 144 modules and 368 dependencies; 0 violations |
| Dead-code/config analysis | Knip passed |

Business intelligence, constraint analysis, recommendation analysis, database
isolation/migrations, MCP intelligence, capability-pack registration,
governance, dashboard generation, UI formatting, and production utility tests
all remain green. Shared, types, events, and Loop packages still use explicit
no-test placeholders and are listed as residual test debt.

## Remaining Differences and Risks

- Authentication, sessions, protected routes, and global RBAC enforcement are
  absent.
- Automation, orchestrator, queue, worker, scheduler, retry, replay, and
  dead-letter execution are absent.
- Event publishers/subscribers and live dashboard updates are absent.
- Observability has no production transport or alerting backend.
- The worktree contains multiple uncommitted convergence and certification
  batches; commit boundaries should be created before further feature work.

## Recommendations

1. Commit the converged registry/certification baseline as an intentional unit.
2. Complete identity and tenant-boundary certification.
3. Define persisted workflow state and event payload contracts.
4. Implement one manual, idempotent workflow behind explicit approval.
5. Add queue/scheduler/runtime adoption only after security and observability
   gates pass.
