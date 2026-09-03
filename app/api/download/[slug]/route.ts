import { NextResponse, type NextRequest } from "next/server";

import { getAppBySlug, recordDownload } from "@/lib/apps";
import { fetchLatestRelease } from "@/lib/github";
import type { Build } from "@/lib/types";

/**
 * The whole distribution layer. Appshop stores nothing, so a download is a
 * lookup of the app's current release followed by a redirect to the GitHub
 * asset. Resolving at request time is what lets a publisher's new tag go live
 * without touching the listing.
 */
export const dynamic = "force-dynamic";

/**
 * Apple silicon has been the default Mac for years, so an ambiguous request
 * gets the arm64 build; `?arch=intel` is the escape hatch for older hardware.
 */
function pickBuild(builds: Build[], requested: string | null): Build | undefined {
  if (builds.length === 0) return undefined;

  if (requested === "intel") {
    return builds.find((b) => b.arch === "intel") ??
      builds.find((b) => b.arch === "universal") ??
      builds[0];
  }
  if (requested === "arm64" || requested === "apple-silicon") {
    return builds.find((b) => b.arch === "apple-silicon") ??
      builds.find((b) => b.arch === "universal") ??
      builds[0];
  }

  return (
    builds.find((b) => b.arch === "apple-silicon") ??
    builds.find((b) => b.arch === "universal") ??
    builds[0]
  );
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/download/[slug]">,
) {
  const { slug } = await context.params;

  const app = await getAppBySlug(slug);
  if (!app || app.status === "draft") {
    return NextResponse.json({ error: "No such app." }, { status: 404 });
  }

  let release;
  try {
    release = await fetchLatestRelease(app.repoOwner, app.repoName);
  } catch (error) {
    console.error(`[appshop] release lookup failed for ${slug}:`, error);
    return NextResponse.redirect(
      new URL(`/apps/${slug}?download=unavailable`, request.url),
    );
  }

  const build = pickBuild(release?.builds ?? [], request.nextUrl.searchParams.get("arch"));

  // Nothing installable attached: send them to the release itself rather than
  // to a dead end.
  if (!build) {
    const fallback =
      release?.url ?? `https://github.com/${app.repoOwner}/${app.repoName}/releases`;
    return NextResponse.redirect(fallback);
  }

  // Counting must never delay or block the redirect.
  void recordDownload(app.id);

  return NextResponse.redirect(build.url);
}
