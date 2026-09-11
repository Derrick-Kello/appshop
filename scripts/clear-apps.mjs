#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Client, TablesDB } from "node-appwrite";

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
      // Ignore missing files
    }
  }
}

loadEnv();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || "appshop";
const appsTableId = process.env.APPWRITE_APPS_TABLE_ID || "apps";

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite credentials.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables = new TablesDB(client);

async function clearApps() {
  console.log(`Connecting to ${endpoint} / database: ${databaseId} / table: ${appsTableId}...`);
  const res = await tables.listRows({
    databaseId,
    tableId: appsTableId,
  });

  console.log(`Found ${res.rows.length} app(s) in Appwrite table.`);
  for (const row of res.rows) {
    console.log(`Deleting ${row.$id} (${row.name || row.slug})...`);
    await tables.deleteRow({
      databaseId,
      tableId: appsTableId,
      rowId: row.$id,
    });
  }
  console.log("All existing apps cleared from Appwrite!");
}

clearApps().catch((err) => {
  console.error("Error clearing apps:", err);
  process.exit(1);
});

