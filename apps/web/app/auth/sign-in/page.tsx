import { safeNextPath } from "../../../src/server/auth";
import { GoogleSignInButton } from "../../../src/components/auth/GoogleSignInButton";
import { AuthShell } from "../../../src/components/auth/AuthShell";

interface SignInPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly expired?: string;
    readonly next?: string;
    readonly reset?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const next = safeNextPath(query.next ?? null, "/dashboard");
  const error = query.expired
    ? "Your session expired. Sign in to continue."
    : query.error;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Continue to your daily brief, health report, and owner actions."
      titleId="sign-in-title"
    >
        {query.reset ? (
          <p className="form-success" role="status">
            Your password was updated. Sign in with the new password.
          </p>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        {/* Google OAuth */}
        <GoogleSignInButton next={next} />

        <div className="auth-divider" aria-hidden="true">
          <span>or</span>
        </div>

        <form action="/api/auth/sign-in" method="post">
          <input name="next" type="hidden" value={next} />
          <label>
            Email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Password
            <input autoComplete="current-password" minLength={8} name="password" required type="password" />
          </label>
          <label className="checkbox-row">
            <input name="rememberMe" type="checkbox" />
            Keep me signed in on this device
          </label>
          <button type="submit">Sign in</button>
        </form>
        <a className="text-link" href="/auth/forgot-password">
          Forgot your password?
        </a>
        <p className="auth-footer">New to BOSS? <a href="/auth/sign-up">Create an account</a></p>
    </AuthShell>
  );
}
