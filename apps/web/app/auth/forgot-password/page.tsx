import { AuthShell } from "../../../src/components/auth/AuthShell";

interface ForgotPasswordPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly sent?: string;
  }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const query = await searchParams;
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter your account email and we will send a secure recovery link."
      titleId="forgot-password-title"
    >
        {query.sent ? (
          <p className="form-success" role="status">
            If that account exists, a recovery email is on its way.
          </p>
        ) : null}
        {query.error ? (
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
    </AuthShell>
  );
}
