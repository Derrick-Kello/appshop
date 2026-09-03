import { NextResponse, type NextRequest } from "next/server";

import { getAppBySlug, recordDownload } from "@/lib/apps";
import { fetchLatestRelease, pickBuild } from "@/lib/github";

/**
 * The whole distribution layer. Appshop stores nothing, so a download is a
 * lookup of the app's current release followed by a redirect to the GitHub
 * asset. Resolving at request time is what lets a publisher's new tag go live
 * without touching the listing.
 *
 * Which build gets served is decided by `pickBuild`, the same function the
 * download panel labels itself with, so the button can never serve something
 * other than what the page promised.
 */
export const dynamic = "force-dynamic";

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

  const build = pickBuild(
    release?.builds ?? [],
    request.nextUrl.searchParams.get("arch"),
  );

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
