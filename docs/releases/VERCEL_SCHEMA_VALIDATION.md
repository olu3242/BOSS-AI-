# Vercel Schema Validation

Date: 2026-07-08

## Source Of Truth

Schema URL:

```text
https://openapi.vercel.sh/vercel.json
```

The schema declares:

- top-level type: object
- `additionalProperties: false`
- allowed top-level properties include `version`, `framework`, `buildCommand`, `installCommand`, and `outputDirectory`
- `projects` is not an allowed top-level property

## Discovered Vercel Config Files

### Root `vercel.json`

Path:

```text
C:\Cdev\BOSS AI\BOSS-AI\vercel.json
```

Current content:

```json
{
  "version": 2
}
```

Validation:

- JSON parses: PASS
- Unsupported properties: none
- Deprecated properties: none
- Redundant properties: `version` is schema-valid but not required for deployment behavior
- Schema status: PASS

### Web App `vercel.json`

Path:

```text
C:\Cdev\BOSS AI\BOSS-AI\apps\web\vercel.json
```

Current content:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm --filter @boss/web... build",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "outputDirectory": ".next"
}
```

Validation:

- JSON parses: PASS
- Unsupported properties: none
- Deprecated properties: none
- Redundant properties: none confirmed
- Schema status: PASS

## Removed Invalid Configuration

Removed from root `vercel.json`:

```json
"projects": [
  {
    "name": "boss-web",
    "src": "apps/web"
  }
]
```

Why invalid:

- `projects` is not present in the official schema top-level property set.
- Vercel CLI previously rejected it with: `should NOT have additional property "projects"`.

Original line:

```text
vercel.json:3
```

## Active `projects` Search

Checked:

```text
vercel.json
apps\web\vercel.json
```

Result:

```text
No "projects" property remains in active vercel.json files.
```

Note: local `.vercel` metadata may contain `projects`, but those files are generated local metadata and are ignored by `.gitignore`; they are not active `vercel.json` deployment configuration.

## Release Gates

- `pnpm lint` - PASS
- `pnpm typecheck` - PASS
- `pnpm test` - PASS
- `pnpm build` - PASS
