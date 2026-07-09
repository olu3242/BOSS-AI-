# Landing Page Component Map

Date: 2026-07-08

## Active Components

| Component | Purpose | Change |
| --- | --- | --- |
| `MarketingNav` | Public navigation and auth CTAs | Added `#gallery` anchor |
| `HeroSection` | Primary landing hero and dashboard mock | Preserved |
| `BusinessOutcomes` | Outcome proof cards | Preserved |
| `IntelligencePreview` | Executive intelligence mock | Preserved |
| `AiWorkforceSection` | AI workforce story | Preserved |
| `WorkspacePreview` | Executive workspace mock | Preserved |
| `ProductGallery` | 32 reusable product showcase assets | Added |
| `EnterpriseTrust` | Trust/security proof | Preserved |

## Removed Duplicates

| File | Reason |
| --- | --- |
| `apps/web/public/landing.html` | Static duplicate landing implementation |
| `apps/web/public/landing-v2.html` | Static alternate landing implementation |

## CTA Map

| CTA | Destination | Status |
| --- | --- | --- |
| Start free | `/auth/sign-up` | Preserved |
| Sign in | `/auth/sign-in` | Preserved |
| Book demo | `/waitlist` | Preserved |
| Pricing | `#pricing` | Preserved |
| Gallery | `#gallery` | Added anchor |
| How it works | `#how` | Preserved |
| AI team | `#team` | Preserved |

## Notes

The gallery is presentation-only static React content. It does not call APIs, alter auth state, change cookies, change middleware behavior, or modify onboarding.
