<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Appshop

A storefront for Mac apps that ship from GitHub. Appshop stores no binaries:
listings are Appwrite rows, and every download is a redirect resolved against
the app's latest GitHub release at request time.

## Architecture

- `lib/github.ts` is the distribution layer. Repo, release and README lookups
  live here, tagged for cache invalidation. `GITHUB_TOKEN` lifts the API limit
  from 60/hour to 5,000/hour and is effectively required in production.
- `lib/apps.ts` is the only place that touches the `apps` table. Reads go
  through the admin client so the public catalogue doesn't depend on who is
  asking; writes go through the caller's session so Appwrite's row permissions
  do the authorization.
- `lib/appwrite/server.ts` holds the two clients. `createSessionClient()`
  returns null when there is no session cookie rather than throwing.
- `app/api/download/[slug]/route.ts` is the whole distribution surface. It
  resolves the current release, picks a build, and 302s to GitHub. Build choice
  lives in `pickBuild` (lib/github.ts) and is shared with `DownloadPanel`, so
  the button can never serve a file other than the one the page named. Format
  outranks architecture there: a universal .dmg beats an arm64 .zip. Do not
  reorder that — it previously served zips to people promised a .dmg.
- `findRepoIcon` walks the repo tree for an `AppIcon.appiconset` or a
  `docs/icon.png`, so listings show the real app icon without anyone pasting a
  URL. The app page backfills a discovered icon onto the row, and only when the
  row has none, so a publisher's own icon is never overwritten.
- `lib/markdown.ts` renders release notes and descriptions. It escapes first
  and supports a fixed subset — do not swap in a general-purpose renderer
  without adding sanitisation, the input is publisher-supplied.

## Conventions

- Design tokens in `app/globals.css` are lifted from the Prepskora site
  (prepskora.smarthivelabs.com) so the Smart Hive Labs properties read as one
  family: white canvas, `#f7f9fc` surfaces, `#e7eaf4` hairlines, one blue
  (`#2863c9`) carrying every primary action. Light only.
- Controls are pills; panels use the generous radii (`rounded-2xl` / `3xl`).
  Elevation is diffuse (`shadow-raise` / `float` / `pop`), never a hard drop.
- Body copy is 15–17px. The old 12–13px scale was too small to read; do not
  reintroduce it.
- Headlines use `.display` (weight 400, -0.035em tracking) or `.display-sm`.
- Search lives in the sticky nav only. Do not add a second search box to a
  page header — one search, always in the same place.
- Server Actions return `{ error }` / `{ ok }` state rather than throwing, so
  forms can render the message.
- Verification (`verified`) is decided server-side from the signed-in GitHub
  identity in `app/(site)/dashboard/actions.ts`. The form must never set it.
- Publisher-supplied image URLs render through plain `<img>`, not `next/image`,
  so there is no remote-pattern allowlist to keep in sync.

## Working on it

```
npm run dev              # Turbopack, port 3000
npm run setup:appwrite   # idempotent schema bootstrap; -- --seed adds listings
npm run typecheck
npm run lint
npm run build
```

Without Appwrite credentials the store still runs: the catalogue falls back to
`lib/seed-apps.ts` and anything that writes says so instead of throwing.
