import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppCard } from "@/components/app-card";
import { AppIcon } from "@/components/app-icon";
import { DownloadPanel, ReleaseHistory } from "@/components/download-panel";
import { DownloadIcon, GitHubIcon, StarIcon, VerifiedIcon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { getAppBySlug, listApps, syncReleaseFacts } from "@/lib/apps";
import { categoryName, findCategory } from "@/lib/categories";
import { formatCount, timeAgo } from "@/lib/format";
import { fetchLatestRelease, fetchReleases, fetchRepo } from "@/lib/github";
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
}> {
  try {
    const [repo, latest, history] = await Promise.all([
      fetchRepo(app.repoOwner, app.repoName),
      fetchLatestRelease(app.repoOwner, app.repoName),
      fetchReleases(app.repoOwner, app.repoName, 6),
    ]);
    return { repo, latest, history };
  } catch (error) {
    console.error(`[appshop] GitHub fetch failed for ${app.slug}:`, error);
    return { repo: null, latest: null, history: [] };
  }
}

export default async function AppPage(props: PageProps<"/apps/[slug]">) {
  const { slug } = await props.params;
  const app = await getAppBySlug(slug);
  if (!app || app.status === "draft") notFound();

  const { repo, latest, history } = await loadGitHub(app);

  // Keep the cached facts on the row fresh so listing pages stay accurate
  // without every card triggering its own GitHub call.
  if (repo && (repo.stars !== app.stars || latest?.tag !== app.latestVersion)) {
    void syncReleaseFacts(app.id, {
      stars: repo.stars,
      latestVersion: latest?.tag ?? "",
      releasedAt: latest?.publishedAt ?? "",
    });
  }

  const related = (await listApps({ category: app.category, limit: 4 })).filter(
    (item) => item.id !== app.id,
  );

  const accent = findCategory(app.category)?.accent ?? "neutral";
  const stars = repo?.stars ?? app.stars;

  return (
    <article>
      <header className="wash-soft -mt-19 rounded-b-3xl pt-19">
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-14 sm:pt-16">
          <nav className="mb-10 flex items-center gap-2 text-[15px] text-muted">
            <Link href="/apps" className="transition-colors hover:text-ink">
              Apps
            </Link>
            <span className="text-ghost">/</span>
            <Link
              href={`/categories/${app.category}`}
              className="transition-colors hover:text-ink"
            >
              {categoryName(app.category)}
            </Link>
          </nav>

          <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
            <AppIcon
              name={app.name}
              slug={app.slug}
              src={app.iconUrl}
              size="xl"
              className="animate-rise"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display-sm text-[40px] sm:text-[46px]">{app.name}</h1>
                {app.verified && (
                  <Badge accent="brand">
                    <VerifiedIcon className="h-4 w-4" />
                    Verified publisher
                  </Badge>
                )}
              </div>

              <p className="mt-3 max-w-2xl text-[18px] leading-8 text-muted">
                {app.tagline}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-muted">
                <Link
                  href={`/developers/${app.ownerGithub || app.repoOwner}`}
                  className="font-medium text-ink transition-colors hover:text-brand"
                >
                  {app.ownerName || app.repoOwner}
                </Link>
                <Badge accent={accent}>{categoryName(app.category)}</Badge>
                {stars > 0 && (
                  <span className="flex items-center gap-1.5">
                    <StarIcon className="h-4 w-4" />
                    {formatCount(stars)}
                  </span>
                )}
                {app.downloads > 0 && (
                  <span className="flex items-center gap-1.5">
                    <DownloadIcon className="h-4 w-4" />
                    {formatCount(app.downloads)} downloads
                  </span>
                )}
                {latest && <span>Updated {timeAgo(latest.publishedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16">
          <div className="min-w-0">
            {app.screenshots.length > 0 && <Screenshots app={app} />}

            <section>
              <h2 className="sr-only">About {app.name}</h2>
              <div
                className="text-[16px] text-body"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(app.description || repo?.description || ""),
                }}
              />
            </section>

            {latest?.notes && (
              <section className="mt-14 border-t border-line pt-12">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="display-sm text-[26px]">What&rsquo;s new</h2>
                  <Badge accent="brand">{latest.tag}</Badge>
                </div>
                <div
                  className="text-[16px] text-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(latest.notes) }}
                />
              </section>
            )}

            {app.tags.length > 0 && (
              <section className="mt-14 border-t border-line pt-10">
                <h2 className="mb-4 text-[15px] font-semibold text-ink">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <Link key={tag} href={`/apps?q=${encodeURIComponent(tag)}`}>
                      <Badge>{tag}</Badge>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <DownloadPanel app={app} release={latest} />

            {history.length > 1 && (
              <Card className="p-6">
                <h2 className="mb-3 text-[15px] font-semibold text-ink">Release history</h2>
                <ReleaseHistory releases={history.slice(0, 6)} />
              </Card>
            )}

            <Card className="p-6">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">Publisher</h2>
              <Link
                href={`/developers/${app.ownerGithub || app.repoOwner}`}
                className="flex items-center gap-3"
              >
                {app.ownerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.ownerAvatar}
                    alt=""
                    className="h-11 w-11 rounded-full border border-line"
                  />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-[15px] font-medium text-brand-ink">
                    {(app.ownerName || app.repoOwner).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-ink">
                    {app.ownerName || app.repoOwner}
                  </span>
                  <span className="block truncate text-[14px] text-muted">
                    @{app.ownerGithub || app.repoOwner}
                  </span>
                </span>
              </Link>

              {app.homepage && (
                <a
                  href={app.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 block truncate text-[15px] text-brand transition-colors hover:text-brand-deep"
                >
                  {app.homepage.replace(/^https?:\/\//, "")}
                </a>
              )}

              <a
                href={`https://github.com/${app.repoOwner}/${app.repoName}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 flex items-center gap-2 text-[15px] text-body transition-colors hover:text-ink"
              >
                <GitHubIcon className="h-4 w-4" />
                {app.repoOwner}/{app.repoName}
              </a>
            </Card>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-line pt-14">
            <h2 className="display-sm mb-8 text-[28px]">
              More in {categoryName(app.category)}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((item) => (
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
