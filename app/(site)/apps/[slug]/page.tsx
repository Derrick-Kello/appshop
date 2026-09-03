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
      <header className="relative overflow-hidden border-b border-hairline">
        <div aria-hidden className="stage-glow pointer-events-none absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-10 sm:pt-16">
          <nav className="mb-8 text-[13px] text-stone">
            <Link href="/apps" className="transition-colors hover:text-ink">
              Apps
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/categories/${app.category}`}
              className="transition-colors hover:text-ink"
            >
              {categoryName(app.category)}
            </Link>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <AppIcon
              name={app.name}
              slug={app.slug}
              src={app.iconUrl}
              size="xl"
              className="animate-soften"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-medium tracking-tight text-ink">{app.name}</h1>
                {app.verified && (
                  <span className="flex items-center gap-1 text-[12px] text-accent-green">
                    <VerifiedIcon className="h-4 w-4" />
                    Verified publisher
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-mute">
                {app.tagline}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ash">
                <Link
                  href={`/developers/${app.ownerGithub || app.repoOwner}`}
                  className="transition-colors hover:text-ink"
                >
                  {app.ownerName || app.repoOwner}
                </Link>
                <Badge accent={accent}>{categoryName(app.category)}</Badge>
                {stars > 0 && (
                  <span className="flex items-center gap-1.5">
                    <StarIcon className="h-3.5 w-3.5" />
                    {formatCount(stars)}
                  </span>
                )}
                {app.downloads > 0 && (
                  <span className="flex items-center gap-1.5">
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

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <div className="min-w-0">
            {app.screenshots.length > 0 && <Screenshots app={app} />}

            <section>
              <h2 className="sr-only">About {app.name}</h2>
              <div
                className="text-[14px] text-body"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(app.description || repo?.description || ""),
                }}
              />
            </section>

            {latest?.notes && (
              <section className="mt-12 border-t border-hairline pt-10">
                <div className="mb-1 flex items-center gap-2.5">
                  <h2 className="text-lg font-medium tracking-tight text-ink">
                    What&rsquo;s new
                  </h2>
                  <Badge>{latest.tag}</Badge>
                </div>
                <div
                  className="text-[14px] text-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(latest.notes) }}
                />
              </section>
            )}

            {app.tags.length > 0 && (
              <section className="mt-12 border-t border-hairline pt-8">
                <h2 className="mb-3 text-[12px] font-medium tracking-wide text-ash uppercase">
                  Tags
                </h2>
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

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <DownloadPanel app={app} release={latest} />

            {history.length > 1 && (
              <Card className="p-5">
                <h2 className="mb-2.5 text-[12px] font-medium tracking-wide text-ash uppercase">
                  Release history
                </h2>
                <ReleaseHistory releases={history.slice(0, 6)} />
              </Card>
            )}

            <Card className="p-5">
              <h2 className="mb-3 text-[12px] font-medium tracking-wide text-ash uppercase">
                Publisher
              </h2>
              <Link
                href={`/developers/${app.ownerGithub || app.repoOwner}`}
                className="flex items-center gap-3"
              >
                {app.ownerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.ownerAvatar}
                    alt=""
                    className="h-9 w-9 rounded-full border border-hairline"
                  />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-elevated text-[13px] text-charcoal">
                    {(app.ownerName || app.repoOwner).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {app.ownerName || app.repoOwner}
                  </span>
                  <span className="block truncate text-[12px] text-ash">
                    @{app.ownerGithub || app.repoOwner}
                  </span>
                </span>
              </Link>

              {app.homepage && (
                <a
                  href={app.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block truncate text-[13px] text-mute transition-colors hover:text-ink"
                >
                  {app.homepage.replace(/^https?:\/\//, "")}
                </a>
              )}

              <a
                href={`https://github.com/${app.repoOwner}/${app.repoName}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-2 text-[13px] text-mute transition-colors hover:text-ink"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                {app.repoOwner}/{app.repoName}
              </a>
            </Card>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-hairline pt-12">
            <h2 className="mb-6 text-lg font-medium tracking-tight text-ink">
              More in {categoryName(app.category)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <section className="mb-10 -mx-5 sm:mx-0">
      <h2 className="sr-only">Screenshots</h2>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-0">
        {app.screenshots.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${app.name} screenshot ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            className="h-auto w-[min(100%,42rem)] shrink-0 snap-start rounded-xl border border-hairline bg-surface object-cover"
          />
        ))}
      </div>
    </section>
  );
}
