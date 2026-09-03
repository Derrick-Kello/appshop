import Link from "next/link";

import { categoryName, findCategory } from "@/lib/categories";
import { excerpt } from "@/lib/markdown";
import { formatCount } from "@/lib/format";
import type { App } from "@/lib/types";

import { AppIcon } from "./app-icon";
import { Badge, cx } from "./ui";
import { DownloadIcon, VerifiedIcon } from "./icons";

export function AppCard({ app, className }: { app: App; className?: string }) {
  const accent = findCategory(app.category)?.accent ?? "neutral";

  return (
    <Link
      href={`/apps/${app.slug}`}
      className={cx(
        "group flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-6",
        "transition-shadow duration-200 hover:shadow-float",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[17px] font-semibold tracking-tight text-ink">
              {app.name}
            </h3>
            {app.verified && (
              <VerifiedIcon className="h-4 w-4 shrink-0 text-brand" />
            )}
          </div>
          <p className="mt-1 truncate text-[14px] text-muted">
            {app.ownerName || app.repoOwner}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 min-h-[3.25rem] text-[15px] leading-[1.625rem] text-body">
        {app.tagline || excerpt(app.description, 110)}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        <Badge accent={accent}>{categoryName(app.category)}</Badge>
        <span className="flex items-center gap-3 text-[14px] text-muted">
          {app.latestVersion && <span>{app.latestVersion}</span>}
          {app.downloads > 0 && (
            <span className="flex items-center gap-1.5">
              <DownloadIcon className="h-4 w-4" />
              {formatCount(app.downloads)}
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}

export function AppGrid({ apps }: { apps: App[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
