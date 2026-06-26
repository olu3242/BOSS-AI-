# Changelog

All notable changes to BOSS are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Goal 2: Business Intelligence Layer
- `packages/db`: raw SQL migrations (11 tables) for Business MRI/DNA/Health/
  Capabilities/Timeline, executed and verified against a live Postgres 16
  instance; migration runner (`migrate.ts`) and validator
  (`validateMigrations.ts`); dual Postgres + in-memory repository adapters
  behind shared interfaces.
- `packages/mcp`: deterministic, non-AI derivation functions
  (`deriveBusinessDna`, `deriveBusinessHealth`, `evaluateCapabilities`).
- `apps/api`: typed services and logic-free controllers for Business
  Profile, MRI, DNA, Health, Capabilities, and Timeline, wired through a
  repository container; end-to-end integration test.
- `docs/adr/0003-business-intelligence-layer.md`.
- Tech Debt Register: TD-007, TD-008; updated TD-001–TD-006 to reflect
  Goal 2 progress.

### Added — Goal 0.5: Engineering Operating System + Core Business Foundation
- Engineering governance: `CONTRIBUTING.md`, `CODEOWNERS`, Definition of
  Done, Coding Standards, Technical Debt Register, Project Health
  Dashboard, ADR process (`docs/adr`).
- GitHub governance: PR template, bug/feature/architecture-proposal issue
  templates.
- CI: lint, typecheck, build, test, and dependency-audit GitHub Actions
  workflow.
- Architecture validation: `dependency-cruiser` boundary/circular-dependency
  checks and `knip` dead-code detection, both wired into CI as `pnpm arch:check`.
- Canonical Business Ontology and Business Graph
  (`packages/types/src/ontology.ts`, `docs/architecture/BUSINESS_ONTOLOGY.md`,
  `docs/architecture/BUSINESS_GRAPH.md`).
- Eight declarative registries in `packages/registries` (capability,
  constraint, KPI, AI employee, workflow, prompt, policy, event).
- Core Business Capability Pack (`industry-packs/general-smb`) populated
  with reusable capabilities, constraints, KPIs, AI employees, workflows,
  and prompts, validated by cross-reference tests.

## [0.1.0] — Goal 0: Repository Normalization
### Added
- pnpm + Turborepo monorepo scaffold: `apps/web`, `apps/api`,
  `packages/{ui,types,config,mcp,loop,events,registries,shared}`,
  `industry-packs/general-smb`, `docs/{architecture,product,execution,adr}`.
- Shared strict TypeScript config, flat ESLint config, Prettier.
- Canonical docs (`README.md`, `CLAUDE.md`, `docs/architecture/ARCHITECTURE.md`,
  `docs/execution/SKILL.md`) sourced from the original BOSS package.
