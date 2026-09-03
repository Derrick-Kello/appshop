"use server";

import { redirect } from "next/navigation";
import { AppwriteException, ID, OAuthProvider } from "node-appwrite";

import { isAppwriteConfigured } from "@/lib/appwrite/config";
import {
  clearSessionCookie,
  createAdminClient,
  createSessionClient,
  setSessionCookie,
} from "@/lib/appwrite/server";

export type AuthState = { error?: string } | undefined;

const NOT_CONFIGURED =
  "Accounts are not switched on yet. Add your Appwrite project to .env.local and run `npm run setup:appwrite`.";

/** Only site-relative paths survive, so `?next=` can't become an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function readable(error: unknown): string {
  if (error instanceof AppwriteException) {
    switch (error.type) {
      case "user_invalid_credentials":
        return "That email and password don't match an account.";
      case "user_already_exists":
      case "user_email_already_exists":
        return "An account already uses that email. Try signing in.";
      case "password_personal_data":
        return "Pick a password that isn't part of your email or name.";
      case "general_rate_limit_exceeded":
        return "Too many attempts. Wait a minute and try again.";
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAppwriteConfigured()) return { error: NOT_CONFIGURED };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Enter your email and password." };

  try {
    const { account } = createAdminClient();
    const session = await account.createEmailPasswordSession({ email, password });
    await setSessionCookie(session.secret, session.expire);
  } catch (error) {
    return { error: readable(error) };
  }

  redirect(next);
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAppwriteConfigured()) return { error: NOT_CONFIGURED };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!name) return { error: "Tell us what to call you." };
  if (!email) return { error: "Enter an email address." };
  if (password.length < 8) return { error: "Passwords need at least 8 characters." };

  try {
    const { account } = createAdminClient();
    await account.create({ userId: ID.unique(), email, password, name });

    const session = await account.createEmailPasswordSession({ email, password });
    await setSessionCookie(session.secret, session.expire);
  } catch (error) {
    return { error: readable(error) };
  }

  redirect(next);
}

/**
 * The SSR OAuth flow: Appwrite hands back a redirect URL, GitHub sends the user
 * to /oauth with a one-time token, and that route trades the token for a session
 * cookie. The browser never holds an Appwrite secret.
 */
export async function signInWithGitHub(formData: FormData): Promise<void> {
  if (!isAppwriteConfigured()) redirect("/sign-in?error=not-configured");

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const next = safeNext(formData.get("next"));

  const { account } = createAdminClient();
  const url = await account.createOAuth2Token({
    provider: OAuthProvider.Github,
    success: `${origin}/oauth?next=${encodeURIComponent(next)}`,
    failure: `${origin}/sign-in?error=oauth`,
    scopes: ["read:user", "user:email"],
  });

  redirect(url);
}

export async function signOut(): Promise<void> {
  try {
    const session = await createSessionClient();
    await session?.account.deleteSession({ sessionId: "current" });
  } catch {
    // A session Appwrite has already dropped still needs its cookie cleared.
  }

  await clearSessionCookie();
  redirect("/");
}
