# OAuth Runtime Validation

Date: 2026-07-08

## Status

BLOCKED - no READY deployment was available for browser-based authentication validation.

## Planned Checks

| Check | Result | Notes |
| --- | --- | --- |
| Email signup | NOT RUN | Blocked by failed preview deployment |
| Email login | NOT RUN | Blocked by failed preview deployment |
| Google OAuth | NOT RUN | Blocked by failed preview deployment |
| Password reset | NOT RUN | Blocked by failed preview deployment |
| Logout | NOT RUN | Blocked by failed preview deployment |
| Session persistence | NOT RUN | Blocked by failed preview deployment |
| Session refresh | NOT RUN | Blocked by failed preview deployment |
| Auth callback | NOT RUN | Blocked by failed preview deployment |
| Cookies | NOT RUN | Blocked by failed preview deployment |
| Middleware | NOT RUN | Blocked by failed preview deployment |
| Protected routes | NOT RUN | Blocked by failed preview deployment |

## Environment Notes

Vercel contains `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Preview and Production by name. Secret values were not inspected or exposed.

Repository auth callback/reset variables were not observed in Vercel env listing:

- `BOSS_AUTH_CALLBACK_URL`
- `BOSS_PASSWORD_RESET_URL`

These should be set to deployed HTTPS URLs before OAuth/password-reset certification.

## Required Follow-Up

Once preview reaches READY:

1. Verify Supabase redirect URL allowlist includes the preview and production callback URLs.
2. Verify Google OAuth authorized redirect URI matches the deployed callback flow.
3. Execute signup/login/OAuth/password-reset flows in a browser.
4. Confirm protected routes reject anonymous users and persist authenticated sessions.
