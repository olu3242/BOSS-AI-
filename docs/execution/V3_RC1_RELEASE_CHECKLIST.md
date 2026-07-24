# BOSS V3 — RC1 Release Checklist

**Date:** 2026-07-24  
**Release:** RC1 — First Release Candidate  
**Branch:** claude/boss-renaissance-v3  
**Commit:** see git log

---

## Code Certification (Automated)

| Item | Status | Evidence |
|---|---|---|
| `pnpm build` — all packages build clean | ✅ | CI job `validate` — all steps green |
| `pnpm lint` — zero warnings | ✅ | CI step "Lint" — passed |
| `pnpm typecheck` — zero errors | ✅ | CI step "Typecheck" — passed |
| `pnpm test` — 689/689 tests pass | ✅ | CI step "Test" — passed |
| Architecture validation — no bounded context violations | ✅ | CI step "Architecture validation" — passed |
| `pnpm audit` — no critical/high vulnerabilities | ✅ | CI step "Dependency audit" — 543 packages verified |

**Latest CI run:** Job `89376872832` — all 11 steps GREEN  
**Commit:** `d56b77d`

---

## Security Certification

| Control | Status |
|---|---|
| Dev token disabled in production | ✅ `NODE_ENV === "production"` guard |
| org_id from JWT only (never body) | ✅ `requireOrgId()` enforced everywhere |
| Token transport via httpOnly cookies only | ✅ Supabase cookie-based sessions |
| CSRF protection via SameSite=Lax | ✅ Supabase default |
| Secret values never in API responses | ✅ Confirmed in code review |
| No debug logging of secrets | ✅ Fixed in this sprint |
| Rate limiting per tenant | ✅ Token bucket, 100 req/min |
| Prometheus endpoint — no tenant data | ✅ Aggregate counters only |

---

## Infrastructure Checklist

| Item | Status | Owner |
|---|---|---|
| Apply migration 0047 in Supabase SQL Editor | ⏳ PENDING | Developer |
| Register custom access token hook in Supabase Dashboard | ⏳ PENDING | Developer |
| Merge PR #11 to main | ⏳ PENDING | Developer |
| Trigger Render redeploy | ⏳ PENDING | Developer (auto after merge) |
| Verify `GET /health` → `{ "status": "ok" }` | ⏳ PENDING | Developer |
| Set `ANTHROPIC_API_KEY` in Render environment | ⏳ PENDING | Developer |

---

## Functional Verification

| Flow | Status | Method |
|---|---|---|
| Public pages (landing, features, pricing, legal) | ✅ | Playwright E2E |
| Auth guard — unauthenticated redirect | ✅ | Playwright E2E |
| Sign-in form renders correctly | ✅ | Playwright E2E |
| Sign-up → verify → onboarding | ⏳ | Manual smoke test (requires live env) |
| Organization creation | ⏳ | Manual smoke test |
| Business onboarding wizard | ⏳ | Manual smoke test |
| Business MRI auto-trigger | ⏳ | Manual smoke test |
| Dashboard loads (empty + data states) | ⏳ | Manual smoke test |
| Mission Control renders | ⏳ | Manual smoke test |
| AI Workforce agent run | ⏳ | Manual smoke test (requires ANTHROPIC_API_KEY) |
| Sign-out and session invalidation | ⏳ | Manual smoke test |

---

## Certification Artifacts

| Document | Status |
|---|---|
| V3_PLATFORM_HEALTH.md | ✅ |
| V3_AUTH_CERTIFICATION.md | ✅ |
| V3_API_HEALTH.md | ✅ |
| V3_SECURITY_REPORT.md | ✅ |
| V3_TENANT_ISOLATION.md | ✅ |
| V3_DATABASE_CERTIFICATION.md | ✅ |
| V3_DASHBOARD_CERTIFICATION.md | ✅ |
| V3_ONBOARDING_CERTIFICATION.md | ✅ |
| V3_BUSINESS_CERTIFICATION.md | ✅ |
| V3_AI_WORKFORCE_CERTIFICATION.md | ✅ |
| V3_MRI_CERTIFICATION.md | ✅ |
| V3_MISSION_CONTROL_CERTIFICATION.md | ✅ |
| V3_OBSERVABILITY_REPORT.md | ✅ |
| V3_PERFORMANCE_REPORT.md | ✅ |
| V3_E2E_CERTIFICATION.md | ✅ |
| V3_PRODUCTION_READINESS.md | ✅ |
| V3_LIVE_SMOKE_TEST.md | ⏳ Pending execution |
| V3_RC1_RELEASE_CHECKLIST.md (this document) | ✅ |
| V3_GO_NO_GO.md | ✅ |

---

## Post-Release Monitoring (First 24h)

- [ ] Watch Render logs for 5xx errors
- [ ] Verify first real sign-up completes end-to-end
- [ ] Confirm JWT contains `org_id` claim
- [ ] Confirm MRI completes for first real business
- [ ] Monitor `/health` every 15 minutes for first hour
