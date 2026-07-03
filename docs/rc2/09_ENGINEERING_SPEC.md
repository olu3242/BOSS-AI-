# RC2 — Engineering Spec

---

## Constraints

- Next.js 14 App Router — all new pages use server components where possible
- Client components only where interactivity requires it (`"use client"`)
- All API calls from `Client.tsx` via `apiClient` (no direct fetch in components)
- `requireActiveTenant(path)` in every server page
- No new API routes, no new migrations

## File Conventions

```
apps/web/
  app/
    (marketing)/           ← Route group for landing pages (no auth)
      page.tsx             ← Landing page (server component)
      layout.tsx           ← Marketing nav/footer
    (app)/                 ← Route group for authenticated pages
      layout.tsx           ← App shell with auth guard
  src/
    components/
      ui/                  ← Primitive components (Button, Card, Badge, etc.)
      marketing/           ← Landing page sections (Hero, Features, etc.)
      workspace/           ← Workspace-specific components
    lib/
      apiClient.ts         ← Existing — do not duplicate
```

## Performance Budget

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Lighthouse Performance | ≥ 90 |
| JS bundle (initial) | < 200KB gzipped |

## Accessibility

- All interactive elements must be keyboard-navigable
- Color contrast: AA minimum (WCAG 2.1)
- All images have meaningful `alt` text
- Zero axe-core violations on CI

## Testing

- Existing 531 tests must continue passing
- New components get Vitest unit tests for non-trivial logic
- No E2E tests required in RC2 (deferred to RC3)
