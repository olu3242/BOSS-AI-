# RC2 — Scroll Story & Motion Spec

**Status:** PENDING — complete after Paymark audit

---

## Scroll Narrative

The landing page tells one story as the user scrolls:

```
↓ Problem (chaos of running a business)
↓ Introduce BOSS (the operating system)
↓ Show the platform (product reveal)
↓ Prove the outcomes (social proof, numbers)
↓ Show it works for your industry
↓ Show the AI Workforce (differentiator)
↓ Remove risk (pricing, FAQ)
↓ Final CTA
```

## Motion Principles

1. **Entrance reveals** — elements fade+slide in as they enter the viewport
2. **Scroll-driven** — sections transform as scroll position changes
3. **Purposeful** — every animation communicates something (reveal, transition, emphasis)
4. **Performance** — all animations use `transform` + `opacity` only (GPU-composited)

## Entrance Pattern

```css
/* Default entrance: fade up */
initial: { opacity: 0, y: 24 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
```

## Stagger Pattern

For lists of cards/features: 80ms stagger between items.

## Hero Animation

TBD — options:
1. Typewriter on headline
2. Gradient mesh background (CSS-only)
3. Dashboard screenshot reveal with scroll parallax

## Implementation

Library: Framer Motion (already in `package.json` or add as peer).  
Scroll trigger: `useInView` from Framer Motion or Intersection Observer.  
Respect `prefers-reduced-motion` — all animations must degrade gracefully.
