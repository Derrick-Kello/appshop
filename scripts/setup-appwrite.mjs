#!/usr/bin/env node
/**
 * Creates the Appwrite database, tables, columns and indexes Appshop needs, and
 * optionally seeds the bundled listings.
 *
 *   npm run setup:appwrite
 *   npm run setup:appwrite -- --seed
 *
 * Safe to run repeatedly: every step treats "already exists" as success, so it
 * doubles as a way to add newly introduced columns to an existing project.
 */

import { readFileSync } from "node:fs";
import { AppwriteException, Client, Databases, ID, Permission, Query, Role, TablesDB } from "node-appwrite";

// --------------------------------------------------------------------- env

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (process.env[key]) continue;
        process.env[key] = raw.trim().replace(/^["']|["']$/g, "");
      }
    } catch {
      // A missing env file is fine; real environment variables win anyway.
    }
  }
}

loadEnv();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || "appshop";
const appsTableId = process.env.APPWRITE_APPS_TABLE_ID || "apps";
const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID || "profiles";

if (!endpoint || !projectId || !apiKey) {
  console.error(
    [
      "",
      "  Missing Appwrite credentials.",
      "",
      "  Set these in .env.local, then run this again:",
      "",
      "    NEXT_PUBLIC_APPWRITE_ENDPOINT   e.g. https://nyc.cloud.appwrite.io/v1",
      "    NEXT_PUBLIC_APPWRITE_PROJECT_ID  from Appwrite console > your project",
      "    APPWRITE_API_KEY                 a server key with databases + users scopes",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const tables = new TablesDB(client);

// ------------------------------------------------------------------ schema

/**
 * `size` is the string length Appwrite reserves. Description is generous
 * because it holds a whole README; everything else is deliberately tight so a
 * bad form post can't write a novel into a card.
 */
const APP_COLUMNS = [
  { key: "slug", type: "string", size: 64, required: true },
  { key: "name", type: "string", size: 128, required: true },
  { key: "tagline", type: "string", size: 200, required: false },
  { key: "description", type: "string", size: 20000, required: false },
  { key: "category", type: "string", size: 32, required: false },
  { key: "platform", type: "string", size: 32, required: false, xdefault: "macos" },
  { key: "repoOwner", type: "string", size: 64, required: true },
  { key: "repoName", type: "string", size: 128, required: true },
  { key: "homepage", type: "string", size: 512, required: false },
  { key: "iconUrl", type: "string", size: 1024, required: false },
  { key: "screenshots", type: "string", size: 1024, required: false, array: true },
  { key: "ownerId", type: "string", size: 64, required: false },
  { key: "ownerName", type: "string", size: 128, required: false },
  { key: "ownerAvatar", type: "string", size: 1024, required: false },
  { key: "ownerGithub", type: "string", size: 64, required: false },
  { key: "status", type: "string", size: 16, required: false, xdefault: "draft" },
  { key: "featured", type: "boolean", required: false, xdefault: false },
  { key: "verified", type: "boolean", required: false, xdefault: false },
  { key: "downloads", type: "integer", required: false, min: 0, xdefault: 0 },
  { key: "stars", type: "integer", required: false, min: 0, xdefault: 0 },
  { key: "latestVersion", type: "string", size: 32, required: false },
  { key: "releasedAt", type: "datetime", required: false },
  { key: "requirements", type: "string", size: 200, required: false },
  { key: "tags", type: "string", size: 32, required: false, array: true },
];

const APP_INDEXES = [
  { key: "slug_unique", type: "unique", columns: ["slug"] },
  { key: "status_idx", type: "key", columns: ["status"] },
  { key: "category_idx", type: "key", columns: ["category"] },
  { key: "owner_idx", type: "key", columns: ["ownerId"] },
  { key: "featured_idx", type: "key", columns: ["featured"] },
  { key: "downloads_idx", type: "key", columns: ["downloads"] },
  { key: "name_search", type: "fulltext", columns: ["name"] },
];

const PROFILE_COLUMNS = [
  { key: "userId", type: "string", size: 64, required: true },
  { key: "handle", type: "string", size: 39, required: true },
  { key: "displayName", type: "string", size: 128, required: false },
  { key: "bio", type: "string", size: 500, required: false },
  { key: "avatarUrl", type: "string", size: 1024, required: false },
  { key: "githubLogin", type: "string", size: 39, required: false },
  { key: "website", type: "string", size: 512, required: false },
];

const PROFILE_INDEXES = [
  { key: "user_unique", type: "unique", columns: ["userId"] },
  { key: "handle_unique", type: "unique", columns: ["handle"] },
];

// ------------------------------------------------------------------ runner

let created = 0;
let existed = 0;

function isDuplicate(error) {
  return (
    error instanceof AppwriteException &&
    (error.code === 409 || String(error.type).includes("already_exists"))
  );
}

async function step(label, run) {
  try {
    await run();
    created++;
    console.log(`  created  ${label}`);
  } catch (error) {
    if (isDuplicate(error)) {
      existed++;
      console.log(`  exists   ${label}`);
      return;
    }
    console.error(`  FAILED   ${label}`);
    throw error;
  }
}

async function createColumn(tableId, column) {
  const common = { databaseId, tableId, key: column.key, required: column.required ?? false };

  switch (column.type) {
    case "string":
      return tables.createStringColumn({
        ...common,
        size: column.size,
        xdefault: column.required ? undefined : column.xdefault,
        array: column.array ?? false,
      });
    case "boolean":
      return tables.createBooleanColumn({
        ...common,
        xdefault: column.required ? undefined : column.xdefault,
      });
    case "integer":
      return tables.createIntegerColumn({
        ...common,
        min: column.min,
        xdefault: column.required ? undefined : column.xdefault,
      });
    case "datetime":
      return tables.createDatetimeColumn({ ...common });
    default:
      throw new Error(`Unknown column type: ${column.type}`);
  }
}

/**
 * Appwrite builds columns asynchronously and rejects an index that references
 * one still in `processing`, so the index pass waits for the schema to settle.
 */
async function waitForColumns(tableId) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const { columns } = await tables.listColumns({ databaseId, tableId });
    const pending = columns.filter((c) => c.status !== "available");
    if (pending.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Columns on "${tableId}" never became available.`);
}

async function buildTable({ tableId, name, columns, indexes, permissions }) {
  console.log(`\n${name}`);

  await step(`table ${tableId}`, () =>
    tables.createTable({
      databaseId,
      tableId,
      name,
      permissions,
      rowSecurity: true,
      enabled: true,
    }),
  );

  for (const column of columns) {
    await step(`column ${tableId}.${column.key}`, () => createColumn(tableId, column));
  }

  process.stdout.write("  waiting for columns to become available… ");
  await waitForColumns(tableId);
  console.log("ready");

  for (const index of indexes) {
    await step(`index ${tableId}.${index.key}`, () =>
      tables.createIndex({
        databaseId,
        tableId,
        key: index.key,
        type: index.type,
        columns: index.columns,
      }),
    );
  }
}

async function seed() {
  let SEED_APPS;
  try {
    ({ SEED_APPS } = await import("../lib/seed-apps.ts"));
  } catch (error) {
    console.error(
      "\n  Could not read lib/seed-apps.ts. Node needs type stripping for this;" +
        "\n  try `node --experimental-strip-types scripts/setup-appwrite.mjs --seed`.",
    );
    throw error;
  }

  console.log("\nSeed listings");

  for (const app of SEED_APPS) {
    const existing = await tables.listRows({
      databaseId,
      tableId: appsTableId,
      queries: [Query.equal("slug", app.slug), Query.limit(1)],
    });

    if (existing.rows.length > 0) {
      console.log(`  exists   ${app.slug}`);
      existed++;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, releasedAt, ...data } = app;

    await step(`row ${app.slug}`, () =>
      tables.createRow({
        databaseId,
        tableId: appsTableId,
        rowId: ID.unique(),
        data,
        permissions: [Permission.read(Role.any())],
      }),
    );
  }
}

async function main() {
  console.log(`\nAppshop → ${endpoint}`);
  console.log(`Project ${projectId}, database "${databaseId}"`);

  await step(`database ${databaseId}`, () =>
    databases.create({ databaseId, name: "Appshop", enabled: true }),
  );

  await buildTable({
    tableId: appsTableId,
    name: "Apps",
    columns: APP_COLUMNS,
    indexes: APP_INDEXES,
    // Anyone reads the catalogue; signed-in users create listings. Per-row
    // permissions set at write time decide who may edit each one.
    permissions: [Permission.read(Role.any()), Permission.create(Role.users())],
  });

  await buildTable({
    tableId: profilesTableId,
    name: "Profiles",
    columns: PROFILE_COLUMNS,
    indexes: PROFILE_INDEXES,
    permissions: [Permission.read(Role.any()), Permission.create(Role.users())],
  });

  if (process.argv.includes("--seed")) await seed();

  console.log(
    [
      "",
      `Done. ${created} created, ${existed} already there.`,
      "",
      "Next:",
      "  1. Appwrite console > Auth > Settings — switch on Email/Password.",
      "  2. Appwrite console > Auth > OAuth2 — switch on GitHub and paste in a",
      "     GitHub OAuth app's client ID and secret. Its callback URL is the one",
      "     Appwrite shows on that panel.",
      "  3. Appwrite console > Settings > Platforms — add a Web platform for your",
      "     site's hostname (localhost for development).",
      "  4. npm run dev",
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error("\nSetup stopped.");
  console.error(error instanceof AppwriteException ? `${error.code} ${error.message}` : error);
  process.exit(1);
});
