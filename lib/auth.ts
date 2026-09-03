import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createSessionClient } from "./appwrite/server";
import type { SessionUser } from "./types";

/**
 * Deduped per request, so a layout, a page and three components can all ask who
 * the user is without three round trips to Appwrite.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const session = await createSessionClient();
    if (!session) return null;

    const user = await session.account.get();
    const prefs = (user.prefs ?? {}) as Record<string, unknown>;

    return {
      id: user.$id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      emailVerification: user.emailVerification,
      githubLogin: typeof prefs.githubLogin === "string" ? prefs.githubLogin : "",
      avatarUrl: typeof prefs.avatarUrl === "string" ? prefs.avatarUrl : "",
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
