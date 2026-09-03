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
    <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="display text-[40px] sm:text-[46px]">Your apps</h1>
          <p className="mt-3 text-[16px] leading-7 text-muted">
            Listings you publish here resolve their downloads from your GitHub releases.
          </p>
        </div>
        <ButtonLink href="/dashboard/new" size="lg">
          <PlusIcon />
          Publish an app
        </ButtonLink>
      </header>

      {apps.length > 0 && (
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <Stat label="Listings" value={String(apps.length)} />
          <Stat label="Published" value={String(published)} />
          <Stat label="Downloads" value={formatCount(totalDownloads)} />
        </div>
      )}

      {apps.length > 0 ? (
        <ul className="space-y-4">
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
    <div className="rounded-2xl bg-surface p-5">
      <p className="text-[14px] text-muted">{label}</p>
      <p className="mt-1.5 text-[28px] font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

const STATUS_ACCENT = {
  published: "good",
  unlisted: "warn",
  draft: "neutral",
} as const;

function AppRow({ app }: { app: App }) {
  return (
    <Card className="flex flex-wrap items-center gap-5 p-5 transition-shadow duration-200 hover:shadow-raise">
      <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/apps/${app.slug}`}
            className="truncate text-[17px] font-semibold text-ink transition-colors hover:text-brand"
          >
            {app.name}
          </Link>
          <Badge accent={STATUS_ACCENT[app.status]}>{app.status}</Badge>
        </div>
        <p className="mt-1 truncate text-[14px] text-muted">
          {categoryName(app.category)} · {app.repoOwner}/{app.repoName}
          {app.latestVersion && ` · ${app.latestVersion}`}
          {app.releasedAt && ` · updated ${timeAgo(app.releasedAt)}`}
        </p>
      </div>

      <div className="flex items-center gap-5 text-[14px] text-muted">
        {app.stars > 0 && (
          <span className="flex items-center gap-1.5">
            <StarIcon className="h-4 w-4" />
            {formatCount(app.stars)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <DownloadIcon className="h-4 w-4" />
          {formatCount(app.downloads)}
        </span>
      </div>

      <ButtonLink href={`/dashboard/apps/${app.id}`} variant="outline" size="sm">
        Edit
      </ButtonLink>
    </Card>
  );
}
