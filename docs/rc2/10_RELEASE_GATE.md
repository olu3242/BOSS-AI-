# RC2 — Release Gate

All criteria must be met before RC2 is declared complete.

---

## Code Quality

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 warnings, 0 errors
- [ ] Dead code: 0 unused files (knip)
- [ ] Existing 531 tests: all passing

## Design System

- [ ] Design tokens defined in `tailwind.config.ts`
- [ ] Component library: Button, Card, Badge, Input, EmptyState, StatTile, PageHeader
- [ ] All components documented in `06_COMPONENT_LIBRARY.md`

## Pages — 5-State Requirement

Every page must implement: Loading (skeleton), Empty (actionable), Error (recoverable), Success, Partial.

| Page | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Landing `/` | | | | | |
| Dashboard `/dashboard` | | | | | |
| Businesses `/businesses` | | | | | |
| Health `/business/[id]/health` | | | | | |
| Decisions | | | | | |
| Scenarios | | | | | |
| Workflows | | | | | |
| Jobs | | | | | |
| Appointments | | | | | |
| Invoices | | | | | |
| Payments | | | | | |
| Reviews | | | | | |
| Analytics | | | | | |

## Landing Page Sections

- [ ] Navigation (responsive, mobile hamburger)
- [ ] Hero (headline, CTA, visual asset)
- [ ] Social proof (logos or stat row)
- [ ] Business Outcomes
- [ ] Operating Systems (How It Works)
- [ ] Industry Gallery
- [ ] Executive Dashboard preview
- [ ] AI Workforce section
- [ ] Pricing
- [ ] FAQ
- [ ] Footer

## Performance

- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] No axe-core violations

## Brand

- [ ] Logo SVG asset present
- [ ] Favicon set
- [ ] OG image set
- [ ] `robots.txt` and `sitemap.xml` present
