import { GoogleSignInButton } from "../../../src/components/auth/GoogleSignInButton";
import { AuthShell } from "../../../src/components/auth/AuthShell";

interface SignUpPageProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  return (
    <AuthShell
      eyebrow="Create your workspace"
      title="Get your free Health Report"
      subtitle="Start with a clear view of what is costing time and money. No credit card required."
      titleId="sign-up-title"
    >
        {query.error ? <p className="form-error" role="alert">{query.error}</p> : null}

        {/* Google OAuth */}
        <GoogleSignInButton />

        <div className="auth-divider" aria-hidden="true">
          <span>or</span>
        </div>

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
    </AuthShell>
  );
}
