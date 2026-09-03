import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

/**
 * Caches the GitHub identity onto the Appwrite account. Publishing checks repo
 * ownership against this login, so resolving it once at sign-in saves every
 * later publish a round trip — and a failure here only costs the verified
 * badge, never the session.
 */
async function cacheGitHubIdentity(userId: string, accessToken: string) {
  if (!accessToken) return;

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "appshop",
    },
    cache: "no-store",
  });
  if (!res.ok) return;

  const profile = (await res.json()) as { login?: string; avatar_url?: string };
  if (!profile.login) return;

  const { users } = createAdminClient();
  const user = await users.get({ userId });

  await users.updatePrefs({
    userId,
    prefs: {
      ...user.prefs,
      githubLogin: profile.login,
      avatarUrl: profile.avatar_url ?? "",
    },
  });
}

/**
 * The GitHub OAuth landing. Appwrite redirects here with a one-time token,
 * which we exchange server-side for a session secret. Doing the exchange here
 * rather than in the browser is what keeps the secret in an httpOnly cookie.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId");
  const secret = params.get("secret");

  const requested = params.get("next") ?? "/dashboard";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";

  if (!userId || !secret) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", request.url));
  }

  let session;
  try {
    const { account } = createAdminClient();
    session = await account.createSession({ userId, secret });
  } catch (error) {
    console.error("[appshop] OAuth exchange failed:", error);
    return NextResponse.redirect(new URL("/sign-in?error=oauth", request.url));
  }

  try {
    await cacheGitHubIdentity(userId, session.providerAccessToken);
  } catch (error) {
    console.error("[appshop] GitHub identity lookup failed:", error);
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(SESSION_COOKIE, session.secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expire),
  });

  return response;
}
