import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type {
  Identity,
  IdentityProvider,
  ProviderSession,
  SignUpResult,
} from "./identity.js";
import { AuthenticationError, SessionVerificationError } from "./identity.js";

function identity(user: User): Identity {
  return {
    userId: user.id,
    email: user.email ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
  };
}

function providerSession(session: Session): ProviderSession {
  return {
    identity: identity(session.user),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
  };
}

function accessTokenExpiry(accessToken: string): string {
  const payload = accessToken.split(".")[1];
  if (!payload) {
    throw new AuthenticationError("The provider returned a malformed access token.");
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    if (!decoded.exp) {
      throw new Error("Missing exp");
    }
    return new Date(decoded.exp * 1000).toISOString();
  } catch {
    throw new AuthenticationError("The provider access token has no valid expiration.");
  }
}

export class SupabaseIdentityProvider implements IdentityProvider {
  constructor(
    private readonly client: SupabaseClient,
    private readonly adminClient?: SupabaseClient,
    private readonly emailRedirectTo?: string,
  ) {}

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): SupabaseIdentityProvider {
   console.log("Identity Runtime Environment", {
  SUPABASE_URL: JSON.stringify(env.SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_URL: JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY_PRESENT: Boolean(env.SUPABASE_ANON_KEY),
  NEXT_PUBLIC_SUPABASE_ANON_KEY_PRESENT: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  NODE_ENV: env.NODE_ENV,
}); const url =
  env.SUPABASE_URL?.trim() || env.NEXT_PUBLIC_SUPABASE_URL?.trim();

const anonKey =
  env.SUPABASE_ANON_KEY?.trim() || env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey) {
      throw new AuthenticationError(
        "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY are required for the identity runtime.",
      );
    }
    const options = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    } as const;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    return new SupabaseIdentityProvider(
      createClient(url, anonKey, options),
      serviceRoleKey
        ? createClient(url, serviceRoleKey, options)
        : undefined,
      env.BOSS_AUTH_CALLBACK_URL,
    );
  }

  async signUp(email: string, password: string, redirectTo?: string): Promise<SignUpResult> {
    const callbackUrl = redirectTo ?? this.emailRedirectTo;
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: callbackUrl ? { emailRedirectTo: callbackUrl } : undefined,
    });
    if (error || !data.user) {
      throw new AuthenticationError(error?.message ?? "Sign-up failed.");
    }
    return {
      identity: identity(data.user),
      session: data.session ? providerSession(data.session) : null,
      verificationRequired: data.session === null,
    };
  }

  async signIn(email: string, password: string): Promise<ProviderSession> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      throw new AuthenticationError(error?.message ?? "Sign-in failed.");
    }
    return providerSession(data.session);
  }

  async verify(accessToken: string): Promise<ProviderSession> {
    const { data: userData, error } = await this.client.auth.getUser(accessToken);
    if (error || !userData.user) {
      throw new SessionVerificationError(error?.message ?? "Session verification failed.");
    }
    return {
      identity: identity(userData.user),
      accessToken,
      refreshToken: "",
      expiresAt: accessTokenExpiry(accessToken),
    };
  }

  async refresh(refreshToken: string): Promise<ProviderSession> {
    const { data, error } = await this.client.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw new AuthenticationError(error?.message ?? "Session refresh failed.");
    }
    return providerSession(data.session);
  }

  async signOut(accessToken: string): Promise<void> {
    if (!this.adminClient) {
      throw new AuthenticationError(
        "SUPABASE_SERVICE_ROLE_KEY is required for server-side session revocation.",
      );
    }
    const { error } = await this.adminClient.auth.admin.signOut(accessToken);
    if (error) {
      throw new AuthenticationError(error.message);
    }
  }

  async requestPasswordReset(email: string, redirectTo?: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      throw new AuthenticationError(error.message);
    }
  }

  async updatePassword(accessToken: string, password: string): Promise<void> {
    if (!this.adminClient) {
      throw new AuthenticationError(
        "SUPABASE_SERVICE_ROLE_KEY is required for server-side password recovery.",
      );
    }
    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new AuthenticationError(
        error?.message ?? "Password recovery session verification failed.",
      );
    }
    const { error: updateError } =
      await this.adminClient.auth.admin.updateUserById(data.user.id, {
        password,
      });
    if (updateError) {
      throw new AuthenticationError(updateError.message);
    }
  }
}
