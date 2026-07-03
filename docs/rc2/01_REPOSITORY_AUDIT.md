# RC2 — Repository Audit

**Date:** 2026-07-03  
**State:** RC1 frozen baseline

---

## Current Web Pages

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Exists — needs Renaissance treatment |
| `/dashboard` | `app/dashboard/` | RC2 Wave 1 scaffold — needs polish |
| `/businesses` | `app/businesses/` | RC2 Wave 1 scaffold — needs polish |
| `/business/[id]/health` | `app/business/[id]/health/` | RC2 Wave 1 scaffold |
| `/business/[id]/workspace/decisions` | `...decisions/` | RC2 Wave 2 scaffold |
| `/business/[id]/workspace/scenarios` | `...scenarios/` | RC2 Wave 2 scaffold |
| `/business/[id]/workspace/workflows` | `...workflows/` | RC2 Wave 2 scaffold |
| `/business/[id]/workspace/jobs` | `...jobs/` | Phase B — functional |
| `/business/[id]/workspace/appointments` | `...appointments/` | Phase B — functional |
| `/business/[id]/workspace/invoices` | `...invoices/` | Phase B — functional |
| `/business/[id]/workspace/payments` | `...payments/` | Phase B — functional |
| `/business/[id]/workspace/reviews` | `...reviews/` | Phase B — functional |
| `/business/[id]/workspace/analytics` | `...analytics/` | Phase B — functional |

---

## Current Design Primitives

| Primitive | Current Value | Target |
|---|---|---|
| Primary font | Syne (display) + DM Sans | TBD from audit |
| Accent color | `#C8102E` (red) | TBD from audit |
| Background | `neutral-950` (near-black) | TBD from audit |
| Border | `neutral-800` | TBD from audit |
| Component style | Tailwind utility classes, no component library | Design system components |
| Motion | None | TBD from `08_SCROLL_STORY.md` |

---

## Gaps Identified (Pre-Transformation)

1. **No design system** — styling is ad hoc Tailwind per file
2. **No shared component library** — button, card, badge each reinvented per page
3. **Landing page** (`/`) is placeholder — no hero, no scroll story, no social proof
4. **No onboarding flow** — user lands post-auth with no guided path
5. **No empty states designed** — functional but not delightful
6. **No motion/animation** — static throughout
7. **No brand assets** — no logo SVG, no illustrations, no icons beyond text
8. **Inconsistent navigation** — workspace nav differs from top-level nav

---

## Files NOT to Touch

```
apps/api/src/**
packages/db/migrations/**
packages/db/src/repositories/**
packages/types/src/ontology.ts  (except UI-only additions)
```
