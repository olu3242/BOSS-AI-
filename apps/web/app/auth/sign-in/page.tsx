import { safeNextPath } from "../../../src/server/auth";

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
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="sign-in-title">
        <p className="eyebrow">Welcome back</p>
        <h1 id="sign-in-title">Sign in</h1>
        <p className="subtle">Continue managing your business in BOSS.</p>
        {query.reset ? (
          <p className="form-success" role="status">
            Your password was updated. Sign in with the new password.
          </p>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
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
      </section>
    </main>
  );
}
