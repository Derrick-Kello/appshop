import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[appshop] Sign-out API error:", err);
    }
  }

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
