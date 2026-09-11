"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

function isRedirect(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "digest" in error && String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT");
}

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;

const NOT_CONFIGURED =
  "Supabase Auth is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

/** Only site-relative paths survive, so `?next=` can't become an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Enter your email and password." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: error instanceof Error ? error.message : "Something went wrong. Try again." };
  }

  redirect(next);
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!name) return { error: "Tell us what to call you." };
  if (!email) return { error: "Enter an email address." };
  if (password.length < 8) return { error: "Passwords need at least 8 characters." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: error instanceof Error ? error.message : "Something went wrong. Try again." };
  }

  redirect(next);
}

/**
 * Initiates the Supabase GitHub OAuth flow. Supabase generates a redirect URL
 * pointing to GitHub OAuth, and after authorization GitHub sends the user back
 * to /auth/callback with an auth code.
 */
export async function signInWithGitHub(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=not-configured");

  const headerList = await headers();
  const host = headerList.get("host");
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  const next = safeNext(formData.get("next"));

  let oauthUrl: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "read:user user:email",
      },
    });

    if (error || !data.url) {
      console.error("[appshop] Supabase GitHub OAuth error:", error);
      redirect(`/sign-in?error=oauth&next=${encodeURIComponent(next)}`);
    }

    oauthUrl = data.url;
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("[appshop] GitHub OAuth initialization failed:", error);
    redirect(`/sign-in?error=oauth&next=${encodeURIComponent(next)}`);
  }

  if (oauthUrl) {
    redirect(oauthUrl);
  }
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[appshop] Sign out failed:", err);
    }
  }

  redirect("/");
}
