# BOSS V3 — API Health Certification

**Date:** 2026-07-24  
**Branch:** claude/boss-renaissance-v3  
**API Base:** https://boss-ai-ppme.onrender.com  
**Status:** CONDITIONAL PASS

---

## Service Configuration

| Setting | Value | Status |
|---|---|---|
| Listen host | `0.0.0.0` (fixed from `127.0.0.1`) | ✅ Fixed — fix pending Render re-deploy |
| Listen port | `process.env.PORT \|\| 4000` | ✅ Correct for Render |
| NODE_ENV | `production` | ✅ Confirmed by preflight log |
| Dev token | Disabled | ✅ `staticTokenPresent: false` in preflight |
| JWT verification | ES256 via JWKS | ✅ `SUPABASE_URL` present |
| Database | Supabase pooler (AWS us-west-2) | ✅ Confirmed by preflight |
| AI inference | Anthropic `claude-sonnet-4-6` | ⚠️ `ANTHROPIC_API_KEY` must be set on Render |

---

## Health Endpoint

```
GET /health
```

Response when healthy:
```json
{
  "status": "ok",
  "uptime": 12345,
  "memoryMb": { "rss": 120, "heapUsed": 80, "heapTotal": 200 },
  "errorRate": 0.0,
  "requestCount": 500
}
```

Returns `503` with `"status": "degraded"` when error rate ≥ 5% or heap > 900 MB.

**Current status:** Could not verify from CI environment (network policy blocks external calls). Verification required post-Render-redeploy.

---

## API Route Coverage

### Auth
| Route | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/auth/dev-token` | POST | None | ✅ Disabled in prod |

### Organizations
| Route | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/org/health` | GET | requireOrgId | ✅ |
| `/api/v1/dashboard` | GET | requireOrgId | ✅ |
| `/api/v1/org/insights` | GET | requireOrgId | ✅ |
| `/api/v1/org/constraint-frequencies` | GET | requireOrgId | ✅ |

### Businesses
| Route | Method | Auth | Status |
|---|---|---|---|
| `POST /api/v1/businesses` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses` | GET | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id` | GET | requireOrgId | ✅ |
| `PATCH /api/v1/businesses/:id` | PATCH | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/health` | GET | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/health-summary` | GET | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/mri` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/mri` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/dna` | GET | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/recommendations` | GET | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/customers` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/customers` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/jobs` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/jobs` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/invoices` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/invoices` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/appointments` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/appointments` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/workforce` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/workforce/:agentId/run` | POST | requireOrgId | ✅ |
| `GET /api/v1/businesses/:id/workflows` | GET | requireOrgId | ✅ |
| `POST /api/v1/businesses/:id/workflows` | POST | requireOrgId | ✅ |

---

## Known Startup Issue (Fixed)

**Root cause:** `server.ts` bound to `127.0.0.1` (loopback). Render's load balancer routes to the container on the external network interface — the process was unreachable, producing 502 on every request.

**Fix:** Changed default `HOST` from `127.0.0.1` to `0.0.0.0` in commit `512611d`. Fix is deployed to PR preview; must be merged and Render service re-deployed to take effect in production.

---

## Certification Decision

**CONDITIONAL PASS.** The API is correctly implemented, all routes are wired, auth is enforced. The 502 root cause is identified and fixed in code. Full PASS pending:

1. PR merged to main
2. Render re-deploys with new `HOST` default
3. `GET /health` returns `200 {"status":"ok"}`
4. `ANTHROPIC_API_KEY` confirmed set in Render environment
