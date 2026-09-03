export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  apiKey: process.env.APPWRITE_API_KEY ?? "",
  databaseId: process.env.APPWRITE_DATABASE_ID || "appshop",
  appsTableId: process.env.APPWRITE_APPS_TABLE_ID || "apps",
  profilesTableId: process.env.APPWRITE_PROFILES_TABLE_ID || "profiles",
};

/** The session cookie. Appwrite session secrets are opaque, so httpOnly + lax is enough. */
export const SESSION_COOKIE = "appshop_session";

/**
 * Whether the store is wired to a real Appwrite project. When false the site
 * still renders — the catalogue falls back to the bundled seed listings and
 * anything that writes says so plainly instead of throwing.
 */
export function isAppwriteConfigured(): boolean {
  return Boolean(appwriteConfig.endpoint && appwriteConfig.projectId);
}

/** Server-side writes additionally need an API key. */
export function isAppwriteAdminConfigured(): boolean {
  return isAppwriteConfigured() && Boolean(appwriteConfig.apiKey);
}
