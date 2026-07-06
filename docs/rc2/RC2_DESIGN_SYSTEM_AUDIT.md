# RC2 Design System Audit

**Date:** 2026-07-03

---

## Token Usage

### Design tokens (Tailwind config)
Defined in `apps/web/tailwind.config.ts`:
- `accent` — #C8102E (primary red)
- `base` — #080808
- `surface` — #141417
- `elevated` — #1c1c21
- `border` — rgba(255,255,255,0.06)
- `text.*` — primary, secondary, muted, inverse
- `status.*` — success, warning, danger, info

### Landing CSS variables (landing.css)
The landing page uses its own CSS custom properties scoped to `.boss-landing`:
- `--red: #c8102e` — matches `accent`
- `--bg: #0a0a0b` — near `base`
- `--card: #141417` — matches `surface`
- `--card2: #1c1c21` — matches `elevated`
- `--border: rgba(255,255,255,0.06)` — matches `border`

**Assessment:** The landing CSS variables and Tailwind tokens are semantically aligned. There is minor divergence in `--bg` (#0a0a0b vs #080808 base) which produces no visible difference. No conflicts.

### New Components (inline styles)
The 5 RC2 components use inline styles with hardcoded values that match the token intent:
- All use `#C8102E` for accent (correct)
- All use `#141417` / `#0a0a0b` for surface/base (correct)
- All use `rgba(255,255,255,0.06)` for borders (correct)
- Typography: Syne for display, DM Sans for body (correct)

**Gap:** New components use inline styles, not Tailwind utility classes. This is acceptable for landing page components (they need precise pixel values) but differs from app shell components which use Tailwind classes.

---

## Component Inventory

| Component | File | Consumers | Type |
|---|---|---|---|
| Button | `Button.tsx` | Various app routes | App UI |
| Badge | `Badge.tsx` | Various app routes | App UI |
| Card | `Card.tsx` | Various app routes | App UI |
| Input/Textarea/Select | `Input.tsx` | Forms | App UI |
| EmptyState | `EmptyState.tsx` | Empty states | App UI |
| StatTile | `StatTile.tsx` | Dashboards | App UI |
| PageHeader | `PageHeader.tsx` | App pages | App UI |
| MarketingNav | `MarketingNav.tsx` | `app/page.tsx` | Marketing |
| HeroSection | `HeroSection.tsx` | `app/page.tsx` | Marketing |
| BusinessOutcomes | `BusinessOutcomes.tsx` | `app/page.tsx` | Marketing |
| IntelligencePreview | `IntelligencePreview.tsx` | `app/page.tsx` | Marketing |
| AiWorkforceSection | `AiWorkforceSection.tsx` | `app/page.tsx` | Marketing |
| EnterpriseTrust | `EnterpriseTrust.tsx` | `app/page.tsx` | Marketing |
| WorkspacePreview | `WorkspacePreview.tsx` | `app/page.tsx` | Marketing |

All 14 components are consumed. Knip reports 0 unused files.

---

## Gaps

1. **No shared animation library** — each component defines its own `@keyframes`. Low priority; each animation is unique.
2. **Inline styles vs Tailwind** — marketing components use inline styles for precision; app components use Tailwind. Divergence is intentional but should be documented.
3. **No responsive breakpoints abstracted** — each component handles its own responsive CSS via `<style>` tags. Works, but not DRY.
4. **No component storybook** — components have no isolated preview environment. Worth adding in RC2 Phase B.
