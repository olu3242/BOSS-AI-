# BOSS Implementation Memory

## Goal 0 — Repository Normalization (complete)

**Status:** Done. Monorepo scaffolded, tooling configured, all pipelines green.

**What exists:**
- Canonical docs sourced from the uploaded package: `README.md`, `CLAUDE.md` (root),
  `docs/architecture/ARCHITECTURE.md` + diagram, `docs/execution/SKILL.md`.
- pnpm workspace (`apps/*`, `packages/*`, `industry-packs/*`) + Turborepo pipeline
  (`build`, `dev`, `lint`, `typecheck`, `test`, `clean`).
- Shared TS config (`packages/config/tsconfig.base.json`, strict mode, ES2022) and
  flat ESLint config (`packages/config/eslint.base.js`) consumed by every workspace
  member via root `tsconfig.json` / `eslint.config.js`.
- Prettier config at root.
- Workspace skeletons (package.json + tsconfig.json + minimal `src/index.ts`,
  no real logic yet):
  - `apps/web`, `apps/api`
  - `packages/types`, `packages/shared`, `packages/ui`, `packages/mcp`,
    `packages/loop`, `packages/events`, `packages/registries`
  - `industry-packs/general-smb` (placeholder only — implemented in Goal 1)
- Landing pages moved to `apps/web/public/`.

**Architectural decisions preserved (per CLAUDE.md "Two Laws"):**
- `packages/mcp` = Brain. Owns intelligence/recommendations. Never executes.
- `packages/loop` = Engine. Owns execution. Contains zero business knowledge —
  its types reference only IDs/state, no industry or business logic.
- `packages/registries` defines the declarative registry interface that both
  the MCP knowledge layer and capability packs (e.g. general-smb) will populate.
  Nothing industry-specific is hardcoded in platform packages.

**Validation:** `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm test` all pass with 16/16 workspace tasks green.

**Known limitations:**
- `apps/web` and `apps/api` are placeholder TS entrypoints, not real
  Next.js/server apps yet — deferred to later goals per the plan.
- No database, no Supabase wiring, no auth — Goal 2+ territory.
- No actual registry entries, capability data, KPIs, or AI employee defs in
  `industry-packs/general-smb` — that's Goal 1.

**Recommended next goal:** Goal 1 — General SMB Capability Pack (renamed
**Core Business Capability Pack**) — populate `packages/registries` with
Business Profile, Capability, Constraint, KPI, Workflow, AI Employee, Prompt,
and Policy registries, and have `industry-packs/general-smb` register its
data against them.
