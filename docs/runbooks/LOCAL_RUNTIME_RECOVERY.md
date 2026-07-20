# Local Runtime Recovery

## Canonical endpoints

| Service | Address | Readiness check |
| --- | --- | --- |
| Web | `http://localhost:3000` | `GET /` |
| API | `http://127.0.0.1:4000` | `GET /health` |

Run both services from the repository root:

```powershell
npm run dev
```

Use `scripts/dev.ps1 -PreflightOnly` to inspect ports and environment readiness without starting either service. Use `scripts/dev.ps1 -SmokeTest` to start both services, probe them, and verify process-tree cleanup.

## Root causes corrected

- The previous bootstrap stopped only the package-manager wrapper processes. Their Node, tsx, and Next.js descendants could survive and retain ports 3000 or 4000.
- Next.js was not assigned an exact port, so a collision could silently move the web application to port 3001.
- The API dev command started a minimal health-only server and did not load `apps/api/.env`; it now starts the full Express API with Node's local env-file support.
- Web environment examples contained duplicate and conflicting API/auth settings. The examples now define one canonical value for each variable.
- Identity services were rebuilt for each server-side call. The Next.js server runtime now reuses one lazily initialized identity/provider runtime per process.

The bootstrap inspects a listener before stopping it. It only terminates a process when the listener command line contains the resolved repository path. An unrelated listener causes a fail-fast message containing its PID and executable; it is never terminated automatically.

## Environment ownership

| Concern | API (`apps/api/.env`) | Next.js server (`apps/web/.env.local`) | Browser bundle |
| --- | --- | --- | --- |
| Supabase URL | `SUPABASE_URL` | `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| Supabase anon key | `SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Never exposed |
| Database | `DATABASE_URL` | `DATABASE_URL` | Never exposed |
| API base URL | n/a | n/a | `NEXT_PUBLIC_API_BASE_URL` |

Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env.local`. Both destination files are ignored by Git. Replace every empty value or angle-bracket placeholder required by the startup warning. Do not place secrets in an `.env.example` file or in `next.config.mjs`.

For local Supabase OAuth, configure the provider callback/redirect allow list for `http://localhost:3000/auth/callback`. Email/password and OAuth ultimately create the same HttpOnly application session cookies before redirecting to `/dashboard`.

## Credential incident response

If a tracked environment template was ever populated with live credentials, sanitizing the working tree is not sufficient. Rotate each exposed provider credential and inspect repository history, open pull requests, CI logs, and deployment logs before treating the incident as closed.
