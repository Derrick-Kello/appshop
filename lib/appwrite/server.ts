import "server-only";

import { cookies } from "next/headers";
import { Account, Client, TablesDB, Users } from "node-appwrite";

import { appwriteConfig, SESSION_COOKIE, isAppwriteConfigured } from "./config";

function baseClient(): Client {
  if (!isAppwriteConfigured()) {
    throw new Error(
      "Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and " +
        "NEXT_PUBLIC_APPWRITE_PROJECT_ID, then run `npm run setup:appwrite`.",
    );
  }
  return new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);
}

/**
 * A client acting as the signed-in user, so Appwrite's row-level permissions do
 * the authorization rather than our own code. Returns null when there is no
 * session cookie.
 */
export async function createSessionClient() {
  const secret = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret) return null;

  const client = baseClient().setSession(secret);
  return {
    client,
    account: new Account(client),
    tables: new TablesDB(client),
  };
}

/**
 * A privileged client. Used for sign-up, session minting, and reads of the
 * public catalogue that must not depend on who is asking.
 */
export function createAdminClient() {
  const client = baseClient();
  if (appwriteConfig.apiKey) client.setKey(appwriteConfig.apiKey);
  return {
    client,
    account: new Account(client),
    tables: new TablesDB(client),
    users: new Users(client),
  };
}

export async function setSessionCookie(secret: string, expire: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expire),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
