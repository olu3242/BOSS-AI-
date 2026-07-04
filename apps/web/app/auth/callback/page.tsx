"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      if (!response.ok) {
        setMessage("We could not establish your session. Please try signing in again.");
        return;
      }
      window.location.replace(redirectTo);
    } catch {
      setMessage("We could not reach the identity service. Try again.");
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-live="polite">
        <p className="eyebrow">Secure verification</p>
        <h1>{message}</h1>
      </section>
    </main>
  );
}
