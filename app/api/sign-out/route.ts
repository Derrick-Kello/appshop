import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";

export async function POST(request: NextRequest) {
  try {
    const session = await createSessionClient();
    await session?.account.deleteSession({ sessionId: "current" });
  } catch {
    // A session Appwrite has already dropped still needs its cookie cleared.
  }

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
