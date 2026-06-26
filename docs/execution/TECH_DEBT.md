# Technical Debt Register

Track debt explicitly instead of letting it hide in TODO comments.
Each entry should be small enough to become a single PR.

| ID | Description | Introduced | Severity | Owner | Status |
|----|--------------|-----------|----------|-------|--------|
| TD-001 | `apps/web` is a placeholder TS entrypoint, not a real Next.js app | Goal 0 | High | unassigned | open |
| TD-002 | `apps/api` is a placeholder TS entrypoint, not a real server | Goal 0 | High | unassigned | open |
| TD-003 | No database/Supabase wiring yet — `docs/architecture/ARCHITECTURE.md` §6 schema is not implemented | Goal 0 | High | unassigned | open |
| TD-004 | `packages/ui`, `packages/mcp`, `packages/loop`, `packages/events` are typed interfaces only, no runtime implementation | Goal 0 | Medium | unassigned | open |
| TD-005 | Registries are in-memory only — no persistence, no admin UI to edit entries | Goal 0.5 | Medium | unassigned | open |
| TD-006 | No auth — CI and local dev have no permission boundary yet | Goal 0 | High | unassigned | open |

## Process

- Add an entry when you knowingly cut a corner — link the PR that
  introduced it.
- Resolve by opening a PR that closes the entry and removes the row (or
  moves it to "resolved" history below if worth keeping for context).
- Review this file at the start of every new Goal; debt blocking the
  next goal must be paid down first.
