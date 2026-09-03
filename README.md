# Appshop

A storefront for Mac apps that ship from GitHub.

Appshop hosts no binaries. A listing is metadata; the download button resolves
against the app's latest GitHub release at the moment someone clicks it. A
publisher who tags a new release has already updated their store page, with
nothing to upload and nothing to re-approve.

Built with Next.js 16, Tailwind 4 and Appwrite.

## What it does

**For people looking for apps.** A browsable, searchable catalogue with
categories, app pages carrying screenshots, release notes and version history,
and a download button that picks the right build for the machine asking.

**For publishers.** Sign in, paste a GitHub repository URL, and Appshop reads
the description, topics, README, stars and latest release to fill the listing
in. Correct whatever it got wrong, pick a category, publish. Every release you
tag after that appears on its own.

**For you.** Your own apps publish through exactly the same path as everyone
else's, so there is one flow to maintain rather than two.

## How distribution works

```
browser → /api/download/crest → GitHub releases API → 302 → the .dmg
```

The route reads the app's `repoOwner/repoName`, fetches the latest release,
picks a build and redirects. Build selection prefers `.dmg`, then `.pkg`, then
`.zip`, and reads the architecture out of the filename: `arm64`, `aarch64` or
`apple-silicon` marks the Apple silicon build, `x86_64` or `intel` the Intel
one, and anything unmarked is treated as universal. Apple silicon wins an
ambiguous request; `?arch=intel` is the escape hatch. Checksums and signatures
sitting alongside the builds are ignored rather than offered as downloads.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Create an Appwrite project

Either from the console at [cloud.appwrite.io](https://cloud.appwrite.io), or
by giving your agent the Appwrite MCP server:

```bash
claude mcp add appwrite --transport http https://mcp.appwrite.io
# then: /mcp → select "appwrite" → Authenticate
```

Fill in `.env.local`:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Console → Overview. The **API** endpoint, not the console URL. |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Console → your project. |
| `APPWRITE_API_KEY` | Console → Integrations → API keys. Needs `databases.*`, `tables.*`, `rows.*` and `users.*`. Server-only. |
| `GITHUB_TOKEN` | A fine-grained token with public read access. Optional but lifts the API limit from 60/hour to 5,000/hour. |
| `NEXT_PUBLIC_SITE_URL` | Your deployed origin. Used for OAuth callbacks and the sitemap. |

### 3. Build the schema

```bash
npm run setup:appwrite            # database, tables, columns, indexes
npm run setup:appwrite -- --seed  # and the two bundled listings
```

Safe to run repeatedly. Every step treats "already exists" as success, so it
doubles as the way to add newly introduced columns to a live project.

### 4. Switch on auth

In the Appwrite console:

1. **Auth → Settings** — enable Email/Password.
2. **Auth → OAuth2 → GitHub** — paste in a GitHub OAuth app's client ID and
   secret. Its authorization callback URL is the one Appwrite shows on that
   panel. Signing in with GitHub is also what earns a listing its verified
   badge.
3. **Settings → Platforms** — add a Web platform for your hostname
   (`localhost` for development).

### 5. Run it

```bash
npm run dev
```

Without Appwrite credentials the store still runs: the catalogue falls back to
the bundled seed listings and anything that writes says so plainly rather than
throwing. That makes it possible to work on the storefront before the backend
exists.

## Data model

One Appwrite table, `apps`, with row-level security. Read is public; create is
open to signed-in users; update and delete are granted per row to the publisher
who created it, so authorization is Appwrite's job rather than the app's.

The columns worth knowing about:

| Column | Why it exists |
| --- | --- |
| `slug` | The public address, `/apps/<slug>`. Uniquely indexed. |
| `repoOwner`, `repoName` | The whole distribution config. Everything release-shaped is derived from these. |
| `status` | `published`, `unlisted` (link works, off the shelves) or `draft`. |
| `verified` | Set server-side when the signed-in GitHub account owns the repo or has push access. The publish form cannot set it. |
| `stars`, `latestVersion`, `releasedAt` | Cached GitHub facts, refreshed when an app page is viewed, so listing pages don't each trigger their own API call. |
| `downloads` | Incremented by the redirect route, best-effort. A failed counter never blocks a download. |

## Project layout

```
app/
  (site)/            store, browse, app pages, dashboard — nav and footer
  (auth)/            sign-in and sign-up — minimal chrome
  api/
    download/[slug]  the redirect that is the whole distribution layer
    github/repo      backs the "paste a repo URL" import step
  oauth/             GitHub OAuth landing; trades a token for a session cookie
components/          UI primitives, cards, the publish form
lib/
  github.ts          repo, release and README lookups
  apps.ts            the only module that touches the apps table
  appwrite/          session and admin clients
  markdown.ts        escape-first renderer for publisher-supplied text
scripts/
  setup-appwrite.mjs idempotent schema bootstrap
```

## Deploying

Any Node host works. On Vercel, set the same environment variables and point
`NEXT_PUBLIC_SITE_URL` at the deployment origin, then add that origin as a Web
platform in Appwrite and to the GitHub OAuth app's callback.

## Design

The token system in `app/globals.css` is taken from the Prepskora site
(prepskora.smarthivelabs.com) so the Smart Hive Labs properties read as one
family: a white canvas, `#f7f9fc` surfaces, `#e7eaf4` hairlines, and one blue
(`#2863c9`) carrying every primary action. Controls are pills, panels use
generous radii, and elevation is diffuse rather than a hard drop shadow.
Light only.

Type is Figtree, the closest free match to the General Sans / TT Talent pairing
on the reference site. Headlines use the `.display` class (weight 400, -0.035em
tracking); body copy sits at 15–17px.
