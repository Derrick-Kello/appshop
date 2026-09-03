import Link from "next/link";

import { AppCard, AppGrid } from "@/components/app-card";
import { AppIcon } from "@/components/app-icon";
import { ArrowIcon, DownloadIcon, GitHubIcon, StarIcon } from "@/components/icons";
import { SearchField } from "@/components/search-field";
import { Badge, ButtonLink, Card, EmptyState, Section, cx } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { isAppwriteConfigured } from "@/lib/appwrite/config";
import { CATEGORIES } from "@/lib/categories";
import { formatCount } from "@/lib/format";
import type { App } from "@/lib/types";

export const revalidate = 300;

export default async function HomePage() {
  const [featured, recent, popular] = await Promise.all([
    listApps({ featured: true, limit: 4 }),
    listApps({ sort: "recent", limit: 6 }),
    listApps({ sort: "popular", limit: 6 }),
  ]);

  const hero = featured[0] ?? recent[0] ?? null;
  const shelf = featured.filter((a) => a.id !== hero?.id).slice(0, 3);

  return (
    <>
      <Hero app={hero} shelf={shelf} />

      <div className="mx-auto max-w-6xl px-5">
        {!isAppwriteConfigured() && <SetupNotice />}

        <Section
          title="Categories"
          action={
            <Link
              href="/categories"
              className="flex items-center gap-1.5 text-[13px] text-mute transition-colors hover:text-ink"
            >
              All categories
              <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group rounded-xl border border-hairline bg-card p-5 transition-colors hover:border-hairline-strong hover:bg-elevated"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[15px] font-medium tracking-tight text-ink">
                    {category.name}
                  </h3>
                  <ArrowIcon className="h-4 w-4 text-stone transition-colors group-hover:text-ink" />
                </div>
                <p className="mt-1.5 text-[13px] leading-6 text-ash">{category.blurb}</p>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title="Recently released"
          action={
            <Link
              href="/apps?sort=recent"
              className="flex items-center gap-1.5 text-[13px] text-mute transition-colors hover:text-ink"
            >
              Browse all
              <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recent.length > 0 ? (
            <AppGrid apps={recent} />
          ) : (
            <EmptyState
              title="Nothing listed yet"
              action={<ButtonLink href="/dashboard/new">Publish the first app</ButtonLink>}
            >
              The shelf fills up as publishers point their repositories here.
            </EmptyState>
          )}
        </Section>

        {popular.some((app) => app.downloads > 0) && (
          <Section title="Most downloaded">
            <AppGrid apps={popular} />
          </Section>
        )}

        <PublisherPitch />
      </div>
    </>
  );
}

function Hero({ app, shelf }: { app: App | null; shelf: App[] }) {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      <div aria-hidden className="hero-stripes pointer-events-none absolute inset-x-0 top-0 h-56" />
      <div aria-hidden className="grid-field pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="animate-rise max-w-2xl">
          <Badge accent="green">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
            Every download comes from a GitHub release
          </Badge>

          <h1 className="display mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl">
            Mac apps, released
            <br />
            straight from GitHub.
          </h1>

          <p className="mt-5 max-w-lg text-[15px] leading-7 text-mute">
            Appshop is a storefront, not a host. Publishers point a repository at
            it once; every tagged release turns into a download on its own. No
            uploads, no review queue, no binaries in the middle.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchField className="w-full sm:w-72" placeholder="Search the store" />
            <ButtonLink href="/publish" variant="secondary">
              <GitHubIcon />
              Publish your app
            </ButtonLink>
          </div>
        </div>

        {app && (
          <div className="animate-soften mt-14 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <FeatureTile app={app} />
            {shelf.length > 0 && (
              <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {shelf.slice(0, 2).map((item) => (
                  <AppCard key={item.id} app={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureTile({ app }: { app: App }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className={cx(
        "stage-glow group relative flex flex-col justify-end overflow-hidden rounded-xl",
        "border border-hairline bg-surface p-7 transition-colors hover:border-hairline-strong",
        "min-h-[16rem]",
      )}
    >
      <Badge accent="green" className="absolute top-5 right-5">
        Featured
      </Badge>

      <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="lg" />

      <h2 className="mt-5 text-2xl font-medium tracking-tight text-ink">{app.name}</h2>
      <p className="mt-2 max-w-md text-[14px] leading-6 text-mute">{app.tagline}</p>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-[12px] text-stone">
        <span>{app.ownerName || app.repoOwner}</span>
        {app.latestVersion && <span className="font-mono">{app.latestVersion}</span>}
        {app.stars > 0 && (
          <span className="flex items-center gap-1">
            <StarIcon className="h-3.5 w-3.5" />
            {formatCount(app.stars)}
          </span>
        )}
        {app.downloads > 0 && (
          <span className="flex items-center gap-1">
            <DownloadIcon className="h-3.5 w-3.5" />
            {formatCount(app.downloads)}
          </span>
        )}
      </div>
    </Link>
  );
}

function SetupNotice() {
  return (
    <Card className="mt-10 border-accent-yellow/25 bg-accent-yellow-soft p-5">
      <p className="text-[13px] font-medium text-accent-yellow">
        Running on the bundled catalogue
      </p>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-mute">
        No Appwrite project is configured, so accounts and publishing are switched
        off and the shelf below is the seed listing. Add your project to{" "}
        <code className="rounded-xs bg-deep px-1.5 py-0.5 font-mono text-[12px] text-charcoal">
          .env.local
        </code>{" "}
        and run{" "}
        <code className="rounded-xs bg-deep px-1.5 py-0.5 font-mono text-[12px] text-charcoal">
          npm run setup:appwrite
        </code>{" "}
        to switch the store on.
      </p>
    </Card>
  );
}

const STEPS = [
  {
    title: "Point at a repo",
    body: "Paste a GitHub URL. Appshop reads the description, topics, README and stars to fill the listing in for you.",
  },
  {
    title: "Tag a release",
    body: "Attach a .dmg, .pkg or .zip to a GitHub release. The store picks the right build for whoever is downloading.",
  },
  {
    title: "Ship again",
    body: "Your next tag is live here the moment GitHub publishes it. There is nothing to re-upload and nothing to re-approve.",
  },
];

function PublisherPitch() {
  return (
    <section className="py-12 sm:py-16">
      <div className="stage-glow overflow-hidden rounded-xl border border-hairline bg-surface p-8 sm:p-12">
        <div className="max-w-xl">
          <h2 className="text-2xl font-medium tracking-tight text-ink">
            Your releases are already the distribution.
          </h2>
          <p className="mt-3 text-[14px] leading-7 text-mute">
            Appshop stores no binaries, which is what makes publishing here take a
            minute rather than an afternoon. The listing is metadata; the download
            button resolves against your latest GitHub release at the moment
            someone clicks it.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="grid h-7 w-7 place-items-center rounded-md border border-hairline bg-elevated font-mono text-[12px] text-mute">
                {index + 1}
              </span>
              <h3 className="mt-3 text-[14px] font-medium text-ink">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-ash">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard/new">Publish an app</ButtonLink>
          <ButtonLink href="/publish" variant="secondary">
            How it works
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
