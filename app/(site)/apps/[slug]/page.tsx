import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppCard } from "@/components/app-card";
import { AppIcon } from "@/components/app-icon";
import { DownloadPanel, ReleaseHistory } from "@/components/download-panel";
import { DownloadIcon, GitHubIcon, LockIcon, StarIcon, VerifiedIcon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { getAppBySlug, listApps, syncReleaseFacts } from "@/lib/apps";
import { categoryName, findCategory } from "@/lib/categories";
import { formatCount, timeAgo } from "@/lib/format";
import {
  fetchLatestRelease,
  fetchReleases,
  fetchRepo,
  findRepoMedia,
  type RepoMedia,
} from "@/lib/github";
import { excerpt, renderMarkdown } from "@/lib/markdown";
import type { App, Release, Repo } from "@/lib/types";

export const revalidate = 600;

export async function generateMetadata(
  props: PageProps<"/apps/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const app = await getAppBySlug(slug);
  if (!app) return { title: "App not found" };

  const description = app.tagline || excerpt(app.description);

  return {
    title: app.name,
    description,
    openGraph: {
      title: `${app.name} · Appshop`,
      description,
      type: "website",
      images: app.screenshots[0] ? [app.screenshots[0]] : undefined,
    },
  };
}

/**
 * GitHub is the source of truth for everything release-shaped, so the page
 * fetches it rather than trusting the row. A GitHub outage degrades the page to
 * the cached facts on the listing instead of failing it.
 */
async function loadGitHub(app: App): Promise<{
  repo: Repo | null;
  latest: Release | null;
  history: Release[];
  media: RepoMedia;
}> {
  try {
    const token = app.githubToken || undefined;
    const [repo, latest, history, media] = await Promise.all([
      fetchRepo(app.repoOwner, app.repoName, token),
      fetchLatestRelease(app.repoOwner, app.repoName, token),
      fetchReleases(app.repoOwner, app.repoName, 6, token),
      app.iconUrl && app.screenshots?.length > 0
        ? Promise.resolve({
            iconUrl: app.iconUrl,
            bannerUrl: app.screenshots[0] ?? "",
            screenshots: app.screenshots,
          })
        : findRepoMedia(app.repoOwner, app.repoName, token),
    ]);
    return { repo, latest, history, media };
  } catch (error) {
    console.error(`[appshop] GitHub fetch failed for ${app.slug}:`, error);
    return {
      repo: null,
      latest: null,
      history: [],
      media: { iconUrl: "", bannerUrl: "", screenshots: [] },
    };
  }
}

export default async function AppPage(props: PageProps<"/apps/[slug]">) {
  const { slug } = await props.params;
  const app = await getAppBySlug(slug);
  if (!app || app.status === "draft") notFound();

  const { repo, latest, history, media } = await loadGitHub(app);
  const iconUrl = app.iconUrl || media.iconUrl;
  const screenshots = app.screenshots?.length > 0 ? app.screenshots : media.screenshots;

  // Keep the cached facts on the row fresh so listing pages stay accurate
  // without every card triggering its own GitHub call.
  const stale =
    repo &&
    (repo.stars !== app.stars ||
      latest?.tag !== app.latestVersion ||
      (media.iconUrl !== "" && media.iconUrl !== app.iconUrl) ||
      (media.screenshots.length > 0 && (!app.screenshots || app.screenshots.length === 0)));

  if (stale && repo) {
    void syncReleaseFacts(app.id, {
      stars: repo.stars,
      latestVersion: latest?.tag ?? "",
      releasedAt: latest?.publishedAt ?? "",
      iconUrl: iconUrl,
      screenshots: screenshots,
    });
  }

  const related = (await listApps({ category: app.category, limit: 4 })).filter(
    (item) => item.id !== app.id,
  );

  const accent = findCategory(app.category)?.accent ?? "neutral";
  const stars = repo?.stars ?? app.stars;

  return (
    <article className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl border border-black/5 flex flex-col gap-10">
        
        {/* Header Hero Area */}
        <header className="border-b border-line/60 pb-8">
          <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-muted">
            <Link href="/apps" className="hover:text-primary transition-colors">
              Apps
            </Link>
            <span className="text-outline-variant">/</span>
            <Link
              href={`/categories/${app.category}`}
              className="hover:text-primary transition-colors"
            >
              {categoryName(app.category)}
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface">{app.name}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start justify-between">
            <div className="flex items-start gap-5 min-w-0">
              <div className="shrink-0 rounded-2xl bg-surface-container p-1 shadow-md">
                <AppIcon
                  name={app.name}
                  slug={app.slug}
                  src={iconUrl}
                  size="xl"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">{app.name}</h1>
                  {app.verified && (
                    <span className="inline-flex items-center gap-1 bg-good-soft text-good text-xs font-bold px-2.5 py-0.5 rounded-full">
                      <VerifiedIcon className="h-3.5 w-3.5" />
                      Verified Publisher
                    </span>
                  )}
                </div>

                <p className="mt-2 text-base text-on-surface-variant max-w-2xl leading-relaxed">
                  {app.tagline}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
                  <Link
                    href={`/developers/${app.ownerGithub || app.repoOwner}`}
                    className="text-on-surface hover:text-primary transition-colors"
                  >
                    by {app.ownerName || app.repoOwner}
                  </Link>
                  <span className="text-outline-variant">•</span>
                  <Badge accent={accent}>{categoryName(app.category)}</Badge>
                  {app.isPrivate ? (
                    <span className="inline-flex items-center gap-1 text-on-surface-variant font-medium">
                      <LockIcon className="h-3.5 w-3.5 text-zinc-400" />
                      Proprietary
                    </span>
                  ) : stars > 0 ? (
                    <span className="flex items-center gap-1 text-amber-500">
                      <StarIcon className="h-3.5 w-3.5" />
                      {formatCount(stars)} stars
                    </span>
                  ) : null}
                  {app.downloads > 0 && (
                    <span className="flex items-center gap-1">
                      <DownloadIcon className="h-3.5 w-3.5" />
                      {formatCount(app.downloads)} downloads
                    </span>
                  )}
                  {latest && <span>Updated {timeAgo(latest.publishedAt)}</span>}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Two-Column Grid */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 flex flex-col gap-8">
            {screenshots.length > 0 && <Screenshots app={{ ...app, screenshots }} />}

            <section className="bg-surface-container-low/40 rounded-2xl p-6 border border-line/60">
              <h2 className="text-lg font-bold text-on-surface mb-4">About {app.name}</h2>
              <div
                className="text-[15px] leading-7 text-on-surface-variant space-y-4"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(app.description || repo?.description || ""),
                }}
              />
            </section>

            {latest?.notes && (
              <section className="bg-surface-container-low/40 rounded-2xl p-6 border border-line/60">
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-lg font-bold text-on-surface">What&rsquo;s new in this release</h2>
                  <span className="bg-primary-container text-white text-xs font-bold px-2 py-0.5 rounded-full">{latest.tag}</span>
                </div>
                <div
                  className="text-[14px] leading-6 text-on-surface-variant space-y-2"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(latest.notes) }}
                />
              </section>
            )}

            {app.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {app.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Download & Spec Sheets */}
          <aside className="space-y-6">
            <DownloadPanel app={app} release={latest} />

            {history.length > 1 && (
              <Card className="p-6 rounded-2xl border border-line bg-surface-container-lowest shadow-sm">
                <h3 className="text-xs font-bold tracking-wider uppercase text-muted mb-4">Release History</h3>
                <ReleaseHistory releases={history.slice(0, 6)} isPrivate={app.isPrivate} />
              </Card>
            )}

            <Card className="p-6 rounded-2xl border border-line bg-surface-container-lowest shadow-sm">
              <h3 className="text-xs font-bold tracking-wider uppercase text-muted mb-4">
                {app.isPrivate ? "Publisher" : "Repository & Publisher"}
              </h3>
              <Link
                href={`/developers/${app.ownerGithub || app.repoOwner}`}
                className="flex items-center gap-3 group"
              >
                {app.ownerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.ownerAvatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover border border-line"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-container text-xs font-bold text-primary">
                    {(app.ownerName || app.repoOwner).slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    {app.ownerName || app.repoOwner}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    @{app.ownerGithub || app.repoOwner}
                  </span>
                </span>
              </Link>

              {app.homepage && (
                <a
                  href={app.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block truncate text-xs font-semibold text-primary hover:underline"
                >
                  {app.homepage.replace(/^https?:\/\//, "")}
                </a>
              )}

              {app.isPrivate ? (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted">
                  <LockIcon className="h-4 w-4 text-zinc-400" />
                  <span>Proprietary / Closed-source</span>
                </div>
              ) : (
                <a
                  href={`https://github.com/${app.repoOwner}/${app.repoName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <GitHubIcon className="h-4 w-4" />
                  {app.repoOwner}/{app.repoName}
                </a>
              )}
            </Card>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-8 border-t border-line/60 pt-10">
            <h2 className="text-xl font-bold text-on-surface mb-6">
              More in {categoryName(app.category)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {related.slice(0, 4).map((item) => (
                <AppCard key={item.id} app={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function Screenshots({ app }: { app: App }) {
  return (
    <section className="mb-12 -mx-5 sm:mx-0">
      <h2 className="sr-only">Screenshots</h2>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:px-0">
        {app.screenshots.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${app.name} screenshot ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            className="h-auto w-[min(100%,44rem)] shrink-0 snap-start rounded-2xl border border-line bg-surface object-cover"
          />
        ))}
      </div>
    </section>
  );
}
