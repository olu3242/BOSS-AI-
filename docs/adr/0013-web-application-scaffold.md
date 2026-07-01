# ADR-0013: `apps/web` becomes a real Next.js 14 App Router application

**Status:** accepted
**Date:** 2026-06-29

## Context

`apps/web` was a one-line placeholder (TD-001) — no framework, no pages, no
connection to the HTTP API built in Goal 13. CLAUDE.md's tech stack
specifies Next.js 14 App Router, Tailwind CSS, dark theme, Syne/DM Sans, and
red (#C8102E) accent. There is still no auth system (TD-006), so any UI work
has to honestly route around that gap rather than fake it.

## Decisions

1. **Real Next.js 14 App Router scaffold**, not a redesign of the whole
   product surface. Three routes: `/` (landing, links to setup),
   `/business/new` (Business Setup form), and
   `/business/[businessId]/mission-control` (reads the Goal 13 Mission
   Control endpoint). This is intentionally a thin slice — enough to prove
   the API is reachable end-to-end from a browser — not the full
   Business Setup/MRI/DNA/Health/Timeline surface TD-001 originally
   described. The rest of that surface is new, explicitly scoped debt
   (TD-029) rather than something silently left half-built here.
2. **`apps/web/src/lib/apiClient.ts`** is a thin typed fetch wrapper over
   the Goal 13 HTTP API (`createBusiness`, `getMissionControlSnapshot`),
   mirroring `ApiClientError` onto the API's `{code, message, details,
   traceId}` envelope so pages can render real error states instead of a
   generic failure.
3. **`DEMO_ORG_ID` placeholder** (`apps/web/src/lib/demoOrg.ts`) stands in
   for a JWT-derived org id, exactly mirroring the HTTP layer's `x-org-id`
   placeholder from ADR-0012. Both are tracked under the same auth debt
   (TD-006) rather than two separate problems.
4. **States designed per CLAUDE.md's UI conventions** within this thin
   slice: the setup form has a real error state (`ApiClientError` message
   surfaced inline) and a loading/disabled-button state during submission;
   Mission Control has an explicit empty state ("No execution evidence
   yet…") distinct from its loaded state, and a dedicated error state if
   the fetch fails.
5. **Tailwind 3** (not 4) was chosen deliberately — v4's config format is
   a larger surface change with no payoff for a three-page scaffold; v3's
   `tailwind.config.ts` + `postcss.config.mjs` pairing is the form most
   examples and tooling still assume.

## Consequences

- TD-001 is narrowed, not fully closed: the placeholder is gone and the app
  is real, but only a fraction of the originally-described page set
  exists. TD-029 captures exactly what's still missing (MRI/DNA/Health/
  Constraints/Recommendations views).
- No component library (`packages/ui`) integration yet — these three pages
  use plain Tailwind classes directly rather than `@boss/ui` components,
  because `packages/ui` itself is still interface-only (TD-004).
- `apps/web` now depends on `next`/`react`/`react-dom`/`tailwindcss` for
  the first time; `tsx` (the old placeholder's dev runner) was removed
  since `next dev` replaces it, keeping `knip`'s dead-dependency check
  clean.

## Alternatives considered

- Building out all five pages TD-001 named before validating the
  API/UI wiring at all. Rejected: a thin, fully-working vertical slice
  (one working flow end-to-end) surfaces integration problems earlier
  than five pages built against an API client that was never exercised.
