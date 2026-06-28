interface ResetPasswordPageProps {
  readonly searchParams: { readonly error?: string };
}

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <p className="eyebrow">Secure recovery</p>
        <h1 id="reset-password-title">Choose a new password</h1>
        {searchParams.error ? (
          <p className="form-error" role="alert">
            The passwords did not match, the link expired, or the update failed.
          </p>
        ) : null}
        <form action="/api/auth/reset-password" method="post">
          <label>
            New password
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label>
            Confirm password
            <input
              autoComplete="new-password"
              minLength={8}
              name="confirmation"
              required
              type="password"
            />
          </label>
          <button type="submit">Update password</button>
        </form>
      </section>
    </main>
  );
}
