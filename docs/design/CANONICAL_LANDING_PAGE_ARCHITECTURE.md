# Canonical Landing Page Architecture

Date: 2026-07-08

## Result

The App Router homepage remains the canonical production landing page:

```text
apps/web/app/page.tsx
```

No route switch, duplicate homepage, middleware change, auth change, onboarding change, API contract change, or business logic change was made.

## Canonical Surface

| Surface | Path | Status |
| --- | --- | --- |
| Public homepage | `apps/web/app/page.tsx` | Canonical |
| Landing styles | `apps/web/app/landing.css` | Canonical scoped stylesheet |
| Navigation | `apps/web/src/components/ui/MarketingNav.tsx` | Active |
| Hero | `apps/web/src/components/ui/HeroSection.tsx` | Active single hero |
| Product gallery | `apps/web/src/components/ui/ProductGallery.tsx` | New reusable visual library |

## Duplicate Implementations Retired

The obsolete static landing pages were removed:

```text
apps/web/public/landing.html
apps/web/public/landing-v2.html
```

They were not backend-wired App Router pages and created duplicate public marketing experiences.

## Preserved Integrations

Existing links and runtime routes were preserved:

```text
/auth/sign-up
/auth/sign-in
/waitlist
/dashboard
/business/new
/business/[businessId]/mri
/marketplace
/api/waitlist
/api/auth/*
```

## Dependency Graph

```text
apps/web/app/page.tsx
  -> MarketingNav
  -> HeroSection
  -> BusinessOutcomes
  -> IntelligencePreview
  -> AiWorkforceSection
  -> WorkspacePreview
  -> ProductGallery
  -> EnterpriseTrust
  -> landing.css
```

## Certification

Exactly one App Router homepage exists at `/`. The legacy static landing HTML files are no longer present in `public`.
