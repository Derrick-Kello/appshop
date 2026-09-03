import Link from "next/link";

import { AppCard, AppGrid } from "@/components/app-card";
import { AppIcon } from "@/components/app-icon";
import { ArrowIcon, CheckIcon, DownloadIcon, StarIcon } from "@/components/icons";
import { Badge, ButtonLink, EmptyState, Panel, Section, cx } from "@/components/ui";
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
  const shelf = featured.filter((app) => app.id !== hero?.id).slice(0, 2);

  return (
    <>
      <Hero app={hero} shelf={shelf} />

      <div className="mx-auto max-w-6xl px-5">
        {!isAppwriteConfigured() && <SetupNotice />}

        <Section
          title="Browse by what it does"
          lede="Six shelves, chosen to match how people actually look for a Mac app."
          action={
            <Link
              href="/categories"
              className="flex items-center gap-1.5 text-[15px] font-medium text-brand transition-colors hover:text-brand-deep"
            >
              All categories
              <ArrowIcon className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group rounded-2xl border border-line bg-canvas p-6 transition-shadow duration-200 hover:shadow-float"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[18px] font-semibold tracking-tight text-ink">
                    {category.name}
                  </h3>
                  <ArrowIcon className="mt-1 h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-brand" />
                </div>
                <p className="mt-2 text-[15px] leading-7 text-muted">{category.blurb}</p>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title="Recently released"
          action={
            <Link
              href="/apps?sort=recent"
              className="flex items-center gap-1.5 text-[15px] font-medium text-brand transition-colors hover:text-brand-deep"
            >
              Browse all
              <ArrowIcon className="h-4 w-4" />
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
      </div>

      <PublisherPitch />
    </>
  );
}

function Hero({ app, shelf }: { app: App | null; shelf: App[] }) {
  return (
    <section className="wash relative -mt-19 rounded-b-3xl pt-19">
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-16 sm:pt-24 sm:pb-20">
        <div className="animate-rise max-w-3xl">
          <h1 className="display text-[46px] sm:text-[68px]">
            Mac apps, released
            <br />
            straight from GitHub.
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-8 text-muted">
            Appshop is a storefront, not a host. Publishers point a repository at
            it once; every tagged release turns into a download on its own. No
            uploads, no review queue, no binaries in the middle.
          </p>

          {/* Search lives in the sticky nav rather than here, so it stays
              reachable once the hero has scrolled away. */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/apps" size="lg">
              Browse the store
              <ArrowIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/publish" variant="soft" size="lg">
              Publish your app
            </ButtonLink>
          </div>
        </div>

        {app && (
          <div className="mt-16 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <FeatureTile app={app} />
            {shelf.length > 0 && (
              <div className="grid content-start gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {shelf.map((item) => (
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
        "group relative flex min-h-[19rem] flex-col justify-end overflow-hidden rounded-3xl",
        "border border-line bg-canvas p-8 transition-shadow duration-200 hover:shadow-pop",
      )}
    >
      <Badge accent="brand" className="absolute top-6 right-6">
        Featured
      </Badge>

      <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="lg" />

      <h2 className="display-sm mt-6 text-[32px]">{app.name}</h2>
      <p className="mt-3 max-w-md text-[16px] leading-7 text-muted">{app.tagline}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted">
        <span>{app.ownerName || app.repoOwner}</span>
        {app.latestVersion && <span>{app.latestVersion}</span>}
        {app.stars > 0 && (
          <span className="flex items-center gap-1.5">
            <StarIcon className="h-4 w-4" />
            {formatCount(app.stars)}
          </span>
        )}
        {app.downloads > 0 && (
          <span className="flex items-center gap-1.5">
            <DownloadIcon className="h-4 w-4" />
            {formatCount(app.downloads)}
          </span>
        )}
      </div>
    </Link>
  );
}

function SetupNotice() {
  return (
    <div className="mt-12 rounded-2xl bg-warn-soft px-6 py-5">
      <p className="text-[15px] font-semibold text-warn">
        Running on the bundled catalogue
      </p>
      <p className="mt-1.5 max-w-2xl text-[15px] leading-7 text-clay">
        No Appwrite project is configured, so accounts and publishing are switched
        off and the shelf below is the seed listing. Add your project to{" "}
        <code className="rounded-md bg-warn-line/50 px-1.5 py-0.5 font-mono text-[14px]">
          .env.local
        </code>{" "}
        and run{" "}
        <code className="rounded-md bg-warn-line/50 px-1.5 py-0.5 font-mono text-[14px]">
          npm run setup:appwrite
        </code>{" "}
        to switch the store on.
      </p>
    </div>
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
    body: "Your next tag is live here the moment GitHub publishes it. Nothing to re-upload, nothing to re-approve.",
  },
];

function PublisherPitch() {
  return (
    <section className="px-5 pb-20">
      <Panel className="mx-auto max-w-6xl px-8 py-14 sm:px-14 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="display text-[36px] sm:text-[46px]">
            Your releases are already the distribution.
          </h2>
          <p className="mt-5 text-[17px] leading-8 text-muted">
            Appshop stores no binaries, which is what makes publishing here take a
            minute rather than an afternoon. The listing is metadata; the download
            button resolves against your latest GitHub release at the moment
            someone clicks it.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-[15px] font-semibold text-brand-ink">
                {index + 1}
              </span>
              <h3 className="mt-4 text-[18px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
          {["No upload step", "No review queue", "Free to publish"].map((claim) => (
            <li key={claim} className="flex items-center gap-2 text-[15px] text-body">
              <CheckIcon className="h-4 w-4 text-good" />
              {claim}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard/new" size="lg">
            Publish an app
          </ButtonLink>
          <ButtonLink href="/publish" variant="outline" size="lg">
            How it works
          </ButtonLink>
        </div>
      </Panel>
    </section>
  );
}
