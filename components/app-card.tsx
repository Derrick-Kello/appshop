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
        "group flex flex-col gap-4 rounded-xl border border-hairline bg-card p-5",
        "transition-colors duration-150 hover:border-hairline-strong hover:bg-elevated",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-medium tracking-tight text-ink">
              {app.name}
            </h3>
            {app.verified && (
              <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-accent-green" />
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-ash">
            {app.ownerName || app.repoOwner}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 min-h-[2.75rem] text-[13px] leading-[1.45rem] text-mute">
        {app.tagline || excerpt(app.description, 110)}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <Badge accent={accent}>{categoryName(app.category)}</Badge>
        <span className="flex items-center gap-3 text-[12px] text-stone">
          {app.latestVersion && <span className="font-mono">{app.latestVersion}</span>}
          {app.downloads > 0 && (
            <span className="flex items-center gap-1">
              <DownloadIcon className="h-3.5 w-3.5" />
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
