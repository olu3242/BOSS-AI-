# RC2 — Design System

**Status:** DRAFT — pending Paymark reference audit

---

## Typographic Scale

| Token | Usage | Current | Target |
|---|---|---|---|
| `font-display` | Hero, section titles | Syne | TBD |
| `font-body` | Body copy, UI labels | DM Sans | TBD |
| `font-mono` | Code, IDs, data | system-mono | TBD |

## Color System

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#C8102E` | Primary CTA, active states |
| `bg-base` | `#080808` | Page background |
| `bg-surface` | `#111111` | Cards, panels |
| `bg-elevated` | `#1a1a1a` | Modals, dropdowns |
| `border` | `#262626` | Dividers, card borders |
| `text-primary` | `#FFFFFF` | Headlines |
| `text-secondary` | `#A3A3A3` | Body, labels |
| `text-muted` | `#525252` | Placeholders, metadata |

> All values are placeholders. Final values determined after Paymark reference audit.

## Spacing

Base unit: `4px`. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | `4px` | Badges, chips |
| `rounded` | `8px` | Buttons, inputs |
| `rounded-lg` | `12px` | Cards |
| `rounded-xl` | `16px` | Panels, modals |
| `rounded-2xl` | `24px` | Feature cards |

## Motion

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `fast` | `150ms` | ease-out | Hover states |
| `base` | `250ms` | ease-in-out | Transitions |
| `slow` | `400ms` | cubic-bezier(0.16, 1, 0.3, 1) | Page reveals |
| `scroll` | Per frame | spring | Scroll-driven animations |

> Motion spec is detailed in `08_SCROLL_STORY.md`.

## Component Contracts

Detailed in `06_COMPONENT_LIBRARY.md`.
