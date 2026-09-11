import { NextResponse, type NextRequest } from "next/server";

import { getAppBySlug, recordDownload } from "@/lib/apps";
import { fetchLatestRelease, getPrivateAssetDownloadUrl, pickBuild } from "@/lib/github";

/**
 * The whole distribution layer. Appshop stores nothing, so a download is a
 * lookup of the app's current release followed by a redirect to the release
 * asset. For proprietary/private apps, asset downloads are signed on demand
 * without ever exposing the private repository or source code.
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

  // Direct proprietary binary URL
  if (app.binaryUrl) {
    void recordDownload(app.id);
    return NextResponse.redirect(app.binaryUrl);
  }

  let release;
  try {
    release = await fetchLatestRelease(
      app.repoOwner,
      app.repoName,
      app.githubToken || undefined,
    );
  } catch (error) {
    console.error(`[appshop] release lookup failed for ${slug}:`, error);
    return NextResponse.redirect(
      new URL(`/apps/${slug}?download=unavailable`, request.url),
    );
  }

  const assetIdParam = request.nextUrl.searchParams.get("assetId");
  const build = assetIdParam
    ? release?.builds.find((b) => String(b.assetId) === assetIdParam)
    : pickBuild(
        release?.builds ?? [],
        request.nextUrl.searchParams.get("arch"),
      );

  // If no build found
  if (!build) {
    // For private apps, NEVER expose the GitHub URL to the visitor
    if (app.isPrivate) {
      return NextResponse.redirect(
        new URL(`/apps/${slug}?download=unavailable`, request.url),
      );
    }
    const fallback =
      release?.url ?? `https://github.com/${app.repoOwner}/${app.repoName}/releases`;
    return NextResponse.redirect(fallback);
  }

  // Counting must never delay or block the redirect.
  void recordDownload(app.id);

  // For private apps, resolve the temporary signed S3 download URL from GitHub
  if (app.isPrivate && build.assetId) {
    const signedUrl = await getPrivateAssetDownloadUrl(
      app.repoOwner,
      app.repoName,
      build.assetId,
      app.githubToken || undefined,
    );
    if (signedUrl) {
      return NextResponse.redirect(signedUrl);
    }
  }

  return NextResponse.redirect(build.url);
}
