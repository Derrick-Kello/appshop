import "server-only";

import { ID, Permission, Query, Role, type Models } from "node-appwrite";

import { appwriteConfig, isAppwriteConfigured } from "./appwrite/config";
import { createAdminClient, createSessionClient } from "./appwrite/server";
import { SEED_APPS } from "./seed-apps";
import type { App, AppStatus } from "./types";

const { databaseId, appsTableId } = appwriteConfig;

/** Appwrite rows come back loosely typed; this is the one place we narrow them. */
function toApp(row: Models.DefaultRow): App {
  const r = row as Models.DefaultRow & Record<string, unknown>;
  const str = (key: string) => (typeof r[key] === "string" ? (r[key] as string) : "");
  const num = (key: string) => (typeof r[key] === "number" ? (r[key] as number) : 0);
  const bool = (key: string) => r[key] === true;
  const list = (key: string) => (Array.isArray(r[key]) ? (r[key] as string[]) : []);

  return {
    id: row.$id,
    slug: str("slug"),
    name: str("name"),
    tagline: str("tagline"),
    description: str("description"),
    category: str("category"),
    platform: str("platform") || "macos",
    repoOwner: str("repoOwner"),
    repoName: str("repoName"),
    homepage: str("homepage"),
    iconUrl: str("iconUrl"),
    screenshots: list("screenshots"),
    ownerId: str("ownerId"),
    ownerName: str("ownerName"),
    ownerAvatar: str("ownerAvatar"),
    ownerGithub: str("ownerGithub"),
    status: (str("status") || "draft") as AppStatus,
    featured: bool("featured"),
    verified: bool("verified"),
    downloads: num("downloads"),
    stars: num("stars"),
    latestVersion: str("latestVersion"),
    releasedAt: str("releasedAt"),
    requirements: str("requirements"),
    tags: list("tags"),
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export type AppInput = Omit<App, "id" | "createdAt" | "updatedAt">;

/** Only these keys are ever written; anything else on the object is dropped. */
function toRow(input: Partial<AppInput>): Record<string, unknown> {
  const keys: (keyof AppInput)[] = [
    "slug", "name", "tagline", "description", "category", "platform",
    "repoOwner", "repoName", "homepage", "iconUrl", "screenshots",
    "ownerId", "ownerName", "ownerAvatar", "ownerGithub", "status",
    "featured", "verified", "downloads", "stars", "latestVersion",
    "releasedAt", "requirements", "tags",
  ];

  const row: Record<string, unknown> = {};
  for (const key of keys) {
    if (input[key] !== undefined) row[key] = input[key];
  }
  // Appwrite rejects "" for a datetime column; it wants null or a real date.
  if (row.releasedAt === "") row.releasedAt = null;
  return row;
}

export type ListOptions = {
  category?: string;
  search?: string;
  sort?: "recent" | "popular" | "name";
  featured?: boolean;
  ownerId?: string;
  status?: AppStatus | "any";
  limit?: number;
  offset?: number;
};

/** Search and sort applied in memory, for the seed catalogue and as a fallback. */
function filterLocally(apps: App[], options: ListOptions): App[] {
  const { category, search, sort = "recent", featured, ownerId, status = "published" } = options;
  let out = [...apps];

  if (status !== "any") out = out.filter((a) => a.status === status);
  if (category) out = out.filter((a) => a.category === category);
  if (featured) out = out.filter((a) => a.featured);
  if (ownerId) out = out.filter((a) => a.ownerId === ownerId);

  if (search) {
    const q = search.toLowerCase();
    out = out.filter((a) =>
      [a.name, a.tagline, a.description, a.repoName, ...a.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  out.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "popular") return b.downloads - a.downloads || b.stars - a.stars;
    return (b.releasedAt || b.createdAt).localeCompare(a.releasedAt || a.createdAt);
  });

  const offset = options.offset ?? 0;
  return out.slice(offset, offset + (options.limit ?? 60));
}

export async function listApps(options: ListOptions = {}): Promise<App[]> {
  if (!isAppwriteConfigured()) return filterLocally(SEED_APPS, options);

  const {
    category, search, sort = "recent", featured, ownerId,
    status = "published", limit = 60, offset = 0,
  } = options;

  const queries: string[] = [Query.limit(limit), Query.offset(offset)];
  if (status !== "any") queries.push(Query.equal("status", status));
  if (category) queries.push(Query.equal("category", category));
  if (featured) queries.push(Query.equal("featured", true));
  if (ownerId) queries.push(Query.equal("ownerId", ownerId));
  if (search) queries.push(Query.search("name", search));

  queries.push(
    sort === "name"
      ? Query.orderAsc("name")
      : sort === "popular"
        ? Query.orderDesc("downloads")
        : Query.orderDesc("$createdAt"),
  );

  try {
    const { tables } = createAdminClient();
    const res = await tables.listRows({ databaseId, tableId: appsTableId, queries });
    return res.rows.map(toApp);
  } catch (error) {
    console.error("[appshop] listApps failed, serving seed catalogue:", error);
    return filterLocally(SEED_APPS, options);
  }
}

export async function getAppBySlug(slug: string): Promise<App | null> {
  if (!isAppwriteConfigured()) {
    return SEED_APPS.find((a) => a.slug === slug) ?? null;
  }

  try {
    const { tables } = createAdminClient();
    const res = await tables.listRows({
      databaseId,
      tableId: appsTableId,
      queries: [Query.equal("slug", slug), Query.limit(1)],
    });
    return res.rows[0] ? toApp(res.rows[0]) : null;
  } catch (error) {
    console.error("[appshop] getAppBySlug failed:", error);
    return SEED_APPS.find((a) => a.slug === slug) ?? null;
  }
}

export async function getAppById(id: string): Promise<App | null> {
  if (!isAppwriteConfigured()) return SEED_APPS.find((a) => a.id === id) ?? null;

  try {
    const { tables } = createAdminClient();
    return toApp(await tables.getRow({ databaseId, tableId: appsTableId, rowId: id }));
  } catch {
    return null;
  }
}

export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const existing = await getAppBySlug(slug);
  return Boolean(existing && existing.id !== exceptId);
}

/**
 * Writes go through the caller's own session, so Appwrite's row permissions —
 * not our code — decide whether the edit is allowed.
 */
export async function createApp(input: AppInput): Promise<App> {
  const session = await createSessionClient();
  if (!session) throw new Error("Sign in to publish an app.");

  const row = await session.tables.createRow({
    databaseId,
    tableId: appsTableId,
    rowId: ID.unique(),
    data: toRow(input),
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(input.ownerId)),
      Permission.delete(Role.user(input.ownerId)),
    ],
  });

  return toApp(row);
}

export async function updateApp(id: string, input: Partial<AppInput>): Promise<App> {
  const session = await createSessionClient();
  if (!session) throw new Error("Sign in to edit an app.");

  const row = await session.tables.updateRow({
    databaseId,
    tableId: appsTableId,
    rowId: id,
    data: toRow(input),
  });

  return toApp(row);
}

export async function deleteApp(id: string): Promise<void> {
  const session = await createSessionClient();
  if (!session) throw new Error("Sign in to delete an app.");

  await session.tables.deleteRow({ databaseId, tableId: appsTableId, rowId: id });
}

/**
 * Bumped on redirect from the download route. Best-effort by design: a failed
 * counter must never block someone's download.
 */
export async function recordDownload(id: string): Promise<void> {
  if (!isAppwriteConfigured() || !appwriteConfig.apiKey) return;
  try {
    const { tables } = createAdminClient();
    await tables.incrementRowColumn({
      databaseId,
      tableId: appsTableId,
      rowId: id,
      column: "downloads",
      value: 1,
    });
  } catch (error) {
    console.error("[appshop] download counter failed:", error);
  }
}

/**
 * Caches GitHub facts onto the row so listing pages don't have to re-fetch.
 * `iconUrl` is only written when one was discovered, so this can backfill an
 * icon onto a listing published before discovery existed without ever clearing
 * one the publisher set by hand.
 */
export async function syncReleaseFacts(
  id: string,
  facts: {
    stars: number;
    latestVersion: string;
    releasedAt: string;
    iconUrl?: string;
  },
): Promise<void> {
  if (!isAppwriteConfigured() || !appwriteConfig.apiKey) return;
  try {
    const { tables } = createAdminClient();
    const data: Record<string, unknown> = {
      stars: facts.stars,
      latestVersion: facts.latestVersion,
      releasedAt: facts.releasedAt || null,
    };
    if (facts.iconUrl) data.iconUrl = facts.iconUrl;

    await tables.updateRow({ databaseId, tableId: appsTableId, rowId: id, data });
  } catch (error) {
    console.error("[appshop] release sync failed:", error);
  }
}
