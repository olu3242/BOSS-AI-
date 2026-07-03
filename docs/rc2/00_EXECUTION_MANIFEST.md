# RC2 — Project Renaissance: Execution Manifest

**Status:** ACTIVE  
**Branch:** `rc2/project-renaissance`  
**Base commit:** `43490e5` (RC1 merge — backend frozen)  
**RC1 Freeze Tag:** `v1.0.0-rc1-freeze`

---

## Mission

Transform BOSS from an exceptional platform into an exceptional product.

RC1 delivered a frozen backend with 531 tests, 28 capabilities, and clean architecture.
RC2 delivers the experience that earns customers.

---

## What RC2 Is NOT

- Not backend work (backend is frozen)
- Not API changes (contract is locked)
- Not a "landing page sprint"

## What RC2 IS

RC2 is a full product experience layer:

| Layer | Scope |
|---|---|
| Marketing | Landing page, hero, scroll story, social proof |
| Design System | Typography, color, spacing, motion, components |
| Product UX | Dashboard, workspace, onboarding, empty states |
| Brand | Voice, tone, visual identity codified in code |
| Storytelling | Business outcomes, industry gallery, use cases |
| Assets | Logos, illustrations, icons, video |

---

## Execution Order

```
01 — Design System foundation
02 — Repository audit vs. Paymark reference
03 — Transformation matrix (NO CODE)
04 — Design system locked (approved)
05 — Navigation
06 — Hero
07 — Business Outcomes section
08 — Operating Systems section
09 — Industry Gallery
10 — Executive Dashboard
11 — AI Workforce section
12 — Pricing
13 — FAQ
14 — Footer
15 — Product UX (workspace pages)
16 — Onboarding flow
17 — Release gate
```

---

## Documents

| File | Purpose |
|---|---|
| `00_EXECUTION_MANIFEST.md` | This file — program overview |
| `01_REPOSITORY_AUDIT.md` | Current codebase state before transformation |
| `02_DESIGN_SYSTEM.md` | Typography, color, spacing, motion |
| `03_INFORMATION_ARCHITECTURE.md` | Page hierarchy, navigation, routing |
| `04_SECTION_TRANSFORMATION.md` | BOSS vs. Paymark comparison per section |
| `05_VISUAL_LANGUAGE.md` | Brand expression in code |
| `06_COMPONENT_LIBRARY.md` | Shared component contracts |
| `07_HERO.md` | Hero section spec |
| `08_SCROLL_STORY.md` | Scroll narrative and motion spec |
| `09_ENGINEERING_SPEC.md` | Technical implementation guide |
| `10_RELEASE_GATE.md` | RC2 acceptance criteria |

---

## Constraints

- Do NOT modify any file under `apps/api/` without explicit approval
- Do NOT modify any file under `packages/db/migrations/` 
- Do NOT modify any service, repository, or route
- All changes are in `apps/web/` and `packages/types/` (UI types only)
- Every page must implement all 5 UI states: loading, empty, error, success, partial

---

## Success Criteria

- [ ] Design system is documented and implemented
- [ ] Paymark reference audit is complete
- [ ] Transformation matrix is approved
- [ ] All 14 sections are implemented
- [ ] All pages pass the 5-state requirement
- [ ] Lighthouse performance score ≥ 90
- [ ] Zero accessibility violations (axe-core)
- [ ] TypeScript: clean
- [ ] ESLint: 0 warnings
- [ ] All existing 531 tests still pass
