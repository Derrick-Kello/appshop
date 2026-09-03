import type { Metadata } from "next";
import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { DownloadIcon, PlusIcon, StarIcon } from "@/components/icons";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { requireUser } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { formatCount, timeAgo } from "@/lib/format";
import type { App } from "@/lib/types";

export const metadata: Metadata = { title: "Your apps" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const apps = await listApps({ ownerId: user.id, status: "any", limit: 100 });

  const totalDownloads = apps.reduce((sum, app) => sum + app.downloads, 0);
  const published = apps.filter((app) => app.status === "published").length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Your apps</h1>
          <p className="mt-1.5 text-[13px] text-ash">
            Listings you publish here resolve their downloads from your GitHub releases.
          </p>
        </div>
        <ButtonLink href="/dashboard/new">
          <PlusIcon />
          Publish an app
        </ButtonLink>
      </header>

      {apps.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Listings" value={String(apps.length)} />
          <Stat label="Published" value={String(published)} />
          <Stat label="Downloads" value={formatCount(totalDownloads)} />
        </div>
      )}

      {apps.length > 0 ? (
        <ul className="space-y-3">
          {apps.map((app) => (
            <li key={app.id}>
              <AppRow app={app} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No listings yet"
          action={<ButtonLink href="/dashboard/new">Publish your first app</ButtonLink>}
        >
          Paste a GitHub repository and Appshop fills in the name, description,
          topics and latest release for you.
        </EmptyState>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[12px] text-ash">{label}</p>
      <p className="mt-1 text-xl font-medium tracking-tight text-ink">{value}</p>
    </Card>
  );
}

const STATUS_ACCENT = {
  published: "green",
  unlisted: "yellow",
  draft: "neutral",
} as const;

function AppRow({ app }: { app: App }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-hairline-strong">
      <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/apps/${app.slug}`}
            className="truncate text-[14px] font-medium text-ink transition-colors hover:text-white"
          >
            {app.name}
          </Link>
          <Badge accent={STATUS_ACCENT[app.status]}>{app.status}</Badge>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-ash">
          {categoryName(app.category)} · {app.repoOwner}/{app.repoName}
          {app.latestVersion && ` · ${app.latestVersion}`}
          {app.releasedAt && ` · updated ${timeAgo(app.releasedAt)}`}
        </p>
      </div>

      <div className="flex items-center gap-4 text-[12px] text-stone">
        {app.stars > 0 && (
          <span className="flex items-center gap-1">
            <StarIcon className="h-3.5 w-3.5" />
            {formatCount(app.stars)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <DownloadIcon className="h-3.5 w-3.5" />
          {formatCount(app.downloads)}
        </span>
      </div>

      <ButtonLink href={`/dashboard/apps/${app.id}`} variant="secondary" size="sm">
        Edit
      </ButtonLink>
    </Card>
  );
}
