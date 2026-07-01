interface SignUpPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  return (
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="sign-up-title">
        <p className="eyebrow">Create your workspace</p>
        <h1 id="sign-up-title">Get started</h1>
        <p className="subtle">Your business data stays isolated to your organization.</p>
        {query.error ? <p className="form-error" role="alert">{query.error}</p> : null}
        <form action="/api/auth/sign-up" method="post">
          <label>
            Work email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Password
            <input autoComplete="new-password" minLength={8} name="password" required type="password" />
          </label>
          <button type="submit">Create account</button>
        </form>
        <p className="auth-footer">Already have an account? <a href="/auth/sign-in">Sign in</a></p>
      </section>
    </main>
  );
}
