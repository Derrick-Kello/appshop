import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  // If redirected by Supabase OAuth with a code, forward to /auth/callback
  if (code) {
    const callbackUrl = new URL("/auth/callback", request.url);
    params.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  const userId = params.get("userId");
  const secret = params.get("secret");
  const requested = params.get("next") ?? "/dashboard";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";

  if (!userId || !secret) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", request.url));
  }

  try {
    const { account } = createAdminClient();
    const session = await account.createSession({ userId, secret });
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(SESSION_COOKIE, session.secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expire),
    });
    return response;
  } catch (error) {
    console.error("[appshop] Legacy OAuth exchange failed:", error);
    return NextResponse.redirect(new URL("/sign-in?error=oauth", request.url));
  }
}
