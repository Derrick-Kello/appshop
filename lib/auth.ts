import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";
import type { SessionUser } from "./types";

/**
 * Deduped per request, so a layout, a page and multiple components can all ask
 * who the user is without multiple round trips to Supabase.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const githubIdentity = user.identities?.find((id) => id.provider === "github");
    const identityData = (githubIdentity?.identity_data ?? {}) as Record<string, unknown>;

    const githubLogin =
      (typeof meta.user_name === "string" ? meta.user_name : "") ||
      (typeof meta.preferred_username === "string" ? meta.preferred_username : "") ||
      (typeof identityData.user_name === "string" ? identityData.user_name : "") ||
      "";

    const avatarUrl =
      (typeof meta.avatar_url === "string" ? meta.avatar_url : "") ||
      (typeof identityData.avatar_url === "string" ? identityData.avatar_url : "") ||
      "";

    const name =
      (typeof meta.full_name === "string" ? meta.full_name : "") ||
      (typeof meta.name === "string" ? meta.name : "") ||
      githubLogin ||
      (user.email ? user.email.split("@")[0] : "Developer");

    return {
      id: user.id,
      name,
      email: user.email ?? "",
      emailVerification: Boolean(user.email_confirmed_at),
      githubLogin,
      avatarUrl,
    };
  } catch {
    // An expired or revoked session reads the same as no session at all.
    return null;
  }
});

export async function requireUser(returnTo = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}
