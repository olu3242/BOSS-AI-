interface VerifyPageProps {
  readonly searchParams: { readonly email?: string };
}

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  return (
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="verify-title">
        <p className="eyebrow">One more step</p>
        <h1 id="verify-title">Check your email</h1>
        <p className="subtle">
          We sent a verification link{searchParams.email ? ` to ${searchParams.email}` : ""}.
          Open it on this device to finish signing in.
        </p>
        <a className="button-link" href="/auth/sign-in">Return to sign in</a>
      </section>
    </main>
  );
}
