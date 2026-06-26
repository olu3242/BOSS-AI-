# Project Health Dashboard

Updated at the end of every Goal. This is a snapshot, not a live
dashboard — the real one ships in a later goal per `README.md` MVP
criteria.

## Status as of Goal 0.5

| Area | Status | Notes |
|------|--------|-------|
| CI (lint/typecheck/build/test) | 🟢 green | `.github/workflows/ci.yml` |
| Dependency audit | 🟢 wired | `pnpm audit --prod` in CI |
| Architecture validation | 🟢 wired | `pnpm arch:check` (dependency-cruiser + knip) in CI |
| Test coverage | 🟡 partial | Only `packages/registries` and `industry-packs/general-smb` have real tests; everything else is a placeholder |
| Database | 🔴 not started | See TD-003 |
| Auth | 🔴 not started | See TD-006 |
| `apps/web` | 🔴 placeholder | See TD-001 |
| `apps/api` | 🔴 placeholder | See TD-002 |
| Registries (capability/constraint/KPI/AI employee/workflow/prompt/policy/event) | 🟢 implemented | `packages/registries`, seeded by `industry-packs/general-smb` + core seeds |
| Business ontology | 🟢 implemented | `packages/types/src/ontology.ts` |
| Business MRI | 🔴 not started | Goal 1 |

## Goals completed

- Goal 0 — Repository Normalization
- Goal 0.5 — Engineering Operating System + Core Business Foundation

## Next goal

Goal 1 — Business Intelligence Foundation (Business Profile, Capability
Assessment, Business MRI framework, Business Health framework, Business
Timeline, Business DNA, repository layer — no AI reasoning, no dashboards,
no workflow execution).
