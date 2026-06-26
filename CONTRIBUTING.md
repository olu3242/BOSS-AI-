# Contributing to BOSS

BOSS is built per the rules in `CLAUDE.md` — read it before contributing.
This file covers the mechanics; `CLAUDE.md` covers the architecture rules.

## Setup

```bash
pnpm install
pnpm dev      # turbo run dev across all apps
```

## Workflow

1. Branch from `main`: `feat/<short-description>` or `fix/<short-description>`.
2. Make your change inside the correct bounded context (see
   `docs/architecture/ARCHITECTURE.md` §2). If you're not sure which
   package owns it, ask before writing code.
3. If the change is architecturally significant, write an ADR first
   (`docs/adr/TEMPLATE.md`) and link it in the PR.
4. Run the full validation suite locally before opening a PR:
   ```bash
   pnpm lint && pnpm typecheck && pnpm build && pnpm test
   ```
5. Open a PR using `.github/PULL_REQUEST_TEMPLATE.md`. CI must be green.
6. A change is only "done" when it satisfies `docs/execution/DEFINITION_OF_DONE.md`.

## Conventions

- Coding standards: `docs/execution/CODING_STANDARDS.md`.
- Every new package follows the existing `apps/*` / `packages/*` script
  contract: `build`, `dev` (apps only), `lint`, `typecheck`, `test`, `clean`.
- Update `MEMORY.md` and `CHANGELOG.md` as part of the same PR that
  changes platform state — not as a follow-up.
- New cross-package dependencies must respect the boundaries enforced by
  `dependency-cruiser` (`pnpm arch:check`) — MCP never depends on Loop's
  execution internals, Loop never imports industry-pack data directly,
  industry packs only depend on `@boss/registries`.

## Reporting issues

- Bug: `.github/ISSUE_TEMPLATE/bug_report.md`
- Feature request: `.github/ISSUE_TEMPLATE/feature_request.md`
- Architecture proposal: `.github/ISSUE_TEMPLATE/architecture_proposal.md`
