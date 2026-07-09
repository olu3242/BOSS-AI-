"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "../../../src/components/auth/AuthShell";
import { getSupabaseBrowser } from "../../../src/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Verifying your account...");
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
      // OAuth PKCE flow — exchange code for session
      void handleOAuthCode(code, next);
    } else {
      // Magic-link / email verification — tokens in hash fragment
      handleHashFragment(next);
    }
  // searchParams is stable after mount — the effect runs once per navigation
  }, [searchParams]);

  async function handleOAuthCode(code: string, next: string) {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        setMessage(error?.message ?? "Authentication failed. Please try again.");
        return;
      }
      await persistSession(data.session.access_token, data.session.refresh_token, next);
    } catch {
      setMessage("We could not complete sign-in. Please try again.");
    }
  }

  function handleHashFragment(next: string) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      setMessage("The verification link is incomplete or expired.");
      return;
    }

    void persistSession(
      accessToken,
      refreshToken,
      type === "recovery" ? "/auth/reset-password" : next,
    );
  }

  async function persistSession(accessToken: string, refreshToken: string, redirectTo: string) {
    try {
      const traceId = crypto.randomUUID();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-boss-auth-trace-id": traceId,
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      if (!response.ok) {
        let referenceId = traceId;
        try {
          const payload = (await response.json()) as { traceId?: string };
          referenceId = payload.traceId ?? traceId;
        } catch {
          // Keep the client-generated trace ID if the server did not return JSON.
        }
        setMessage(
          `Your Google account was verified, but BOSS could not finish setting up your session. Reference ID: ${referenceId}`,
        );
        return;
      }
      window.location.replace(redirectTo);
    } catch {
      setMessage("We could not reach the identity service. Try again.");
    }
  }

  return (
    <AuthShell
      eyebrow="Secure verification"
      title={message}
      subtitle="Keep this tab open while BOSS confirms your session."
      titleId="auth-callback-title"
      live
    >
      <div className="auth-loading-bar" aria-hidden="true" />
    </AuthShell>
  );
}
