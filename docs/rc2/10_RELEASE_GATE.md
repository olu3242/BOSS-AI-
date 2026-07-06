# RC2 — Release Gate

All criteria must be met before RC2 is declared complete.

---

## Code Quality

- [x] TypeScript: 0 errors
- [x] ESLint: 0 warnings, 0 errors
- [x] Dead code: 0 unused files (knip — clean)
- [x] Existing tests: all passing (536 tests — 531 API + 5 web)

## Design System

- [x] Design tokens defined in `tailwind.config.ts`
- [x] Component library: Button, Card, Badge, Input, EmptyState, StatTile, PageHeader, Skeleton
- [x] All components documented in `06_COMPONENT_LIBRARY.md`

## Pages — 5-State Requirement

Every page must implement: Loading (skeleton), Empty (actionable), Error (recoverable), Success, Partial.

| Page | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Landing `/` | n/a | n/a | n/a | ✅ | n/a |
| Dashboard `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Businesses `/businesses` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Health `/business/[id]/health` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Decisions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Scenarios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workflows | ✅ | ✅ | ✅ | ✅ | ✅ |
| Jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Appointments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invoices | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reviews | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ |

## Landing Page Sections

- [x] Navigation (responsive, mobile hamburger)
- [x] Hero (headline, CTA, visual asset)
- [x] Social proof (trust bar with industries)
- [x] Business Outcomes
- [x] Operating Systems (How It Works — 4-step)
- [x] Industry Gallery
- [x] Executive Dashboard preview (IntelligencePreview + WorkspacePreview)
- [x] AI Workforce section
- [x] Pricing (3-tier)
- [x] FAQ (6 items, `<details>` accordion)
- [x] Footer (logo, nav columns, legal strip)

## Performance

- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] No axe-core violations

## Brand

- [x] Logo SVG asset present (`app/icon.svg`)
- [x] Favicon set (`app/icon.svg` — Next.js auto-serves)
- [x] OG image set (`app/opengraph-image.tsx`)
- [x] `robots.txt` and `sitemap.xml` present (route handlers)
