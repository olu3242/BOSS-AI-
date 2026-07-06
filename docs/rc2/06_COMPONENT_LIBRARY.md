# RC2 — Component Library

**Status:** DRAFT

---

## Primitives

### Button

```tsx
<Button variant="primary" | "secondary" | "ghost" | "danger" size="sm" | "md" | "lg" />
```

| Variant | Background | Text | Use |
|---|---|---|---|
| primary | accent | white | Main CTA |
| secondary | surface | primary | Alternative action |
| ghost | transparent | secondary | Tertiary, nav |
| danger | red-950 | red-400 | Destructive |

### Badge / Chip

```tsx
<Badge color="green" | "yellow" | "red" | "blue" | "neutral" size="sm" | "md" />
```

### Card

```tsx
<Card padding="sm" | "md" | "lg" border hoverable />
```

### Input / Select / Textarea

Uniform: `rounded border border-border bg-surface px-3 py-2 text-sm focus:border-accent`

### Skeleton

Match exact layout of target component. Never use a generic bar.

---

## Compositions

### Stat Tile

```tsx
<StatTile label="Total Revenue" value="$124,000" delta="+12%" trend="up" />
```

### Empty State

```tsx
<EmptyState
  icon={<Icon />}
  title="No jobs yet"
  description="Create your first job to get started."
  action={<Button>Create Job</Button>}
/>
```

### Page Header

```tsx
<PageHeader
  title="Jobs"
  description="12 active · 3 completed"
  action={<Button>+ New Job</Button>}
/>
```

---

## Location

Components live in `apps/web/src/components/ui/`.

Each component is a single `.tsx` file. No barrel re-exports until library is stable.
