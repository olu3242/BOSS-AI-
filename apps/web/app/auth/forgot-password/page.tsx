interface ForgotPasswordPageProps {
  readonly searchParams: {
    readonly error?: string;
    readonly sent?: string;
  };
}

export default function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  return (
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="forgot-password-title">
        <p className="eyebrow">Account recovery</p>
        <h1 id="forgot-password-title">Reset your password</h1>
        <p className="subtle">
          Enter your account email and we will send a secure recovery link.
        </p>
        {searchParams.sent ? (
          <p className="form-success" role="status">
            If that account exists, a recovery email is on its way.
          </p>
        ) : null}
        {searchParams.error ? (
          <p className="form-error" role="alert">
            Password recovery is temporarily unavailable.
          </p>
        ) : null}
        <form action="/api/auth/forgot-password" method="post">
          <label>
            Email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <button type="submit">Send recovery link</button>
        </form>
        <p className="auth-footer">
          <a href="/auth/sign-in">Return to sign in</a>
        </p>
      </section>
    </main>
  );
}
