# Coding Standards

These extend `CLAUDE.md`; where they conflict, `CLAUDE.md` wins.

## TypeScript

- Strict mode everywhere (`packages/config/tsconfig.base.json`). No `any`.
- Prefer `interface` for object shapes that may be extended, `type` for
  unions/aliases.
- No default exports — named exports only, for greppability and clean
  re-exports through package `index.ts` barrels.
- Side effects (registry registration, etc.) live behind an explicit
  `seedX()` / `installX()` function — never run at module import time.
  This keeps registration order deterministic and testable.

## Package structure

- Every package/app exposes the same script contract: `build`, `lint`,
  `typecheck`, `test`, `clean` (`dev` for apps only).
- A package's public API is whatever its `src/index.ts` exports — nothing
  else is imported across package boundaries. Enforced by
  `pnpm arch:check` (dependency-cruiser).
- New cross-package dependencies are declared in `package.json` as
  `workspace:*` — never deep-imported by relative path across a package
  boundary.

## Registries

- Registry entries are plain data (no functions, no classes) so they can
  be serialized, diffed, and tested.
- Cross-references between registries (e.g. a workflow's
  `relatedConstraints`) must point at real keys — covered by tests, not
  just convention (see `industry-packs/general-smb/src/__tests__`).

## Architecture boundaries (Two Laws)

- `packages/mcp` never imports `packages/loop`, and contains no scheduling,
  retries, or state machines.
- `packages/loop` never imports `packages/mcp` or any `industry-packs/*`
  package directly — it receives data, it does not know where it came from.
- `industry-packs/*` may depend on `packages/registries` and
  `packages/types` only.

## Testing

- `vitest` for unit tests. A package with no meaningful unit tests yet
  keeps the placeholder `echo "no tests yet" && exit 0` script rather than
  a fake passing test.
- Registry-backed packs must have at least one test asserting their
  cross-reference integrity (see ADR-0002).

## Formatting

- Prettier is authoritative — run `pnpm format`, don't hand-format.
