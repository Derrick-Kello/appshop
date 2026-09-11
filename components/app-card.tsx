import Link from "next/link";

import { categoryName } from "@/lib/categories";
import { excerpt } from "@/lib/markdown";
import { formatCount } from "@/lib/format";
import type { App } from "@/lib/types";

import { AppIcon } from "./app-icon";
import { cx } from "./ui";
import { LockIcon, StarIcon, VerifiedIcon } from "./icons";

// Curated colorful gradients for banner backgrounds when screenshot is not available
const GRADIENTS = [
  "from-blue-600/20 via-indigo-500/10 to-purple-600/20",
  "from-violet-600/20 via-fuchsia-500/10 to-pink-600/20",
  "from-cyan-600/20 via-teal-500/10 to-emerald-600/20",
  "from-amber-600/20 via-orange-500/10 to-red-600/20",
  "from-indigo-600/20 via-blue-500/10 to-cyan-600/20",
];

export function AppCard({ app, className }: { app: App; className?: string }) {
  const gradient = GRADIENTS[Math.abs(app.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % GRADIENTS.length];
  const screenshot = app.screenshots && app.screenshots.length > 0 ? app.screenshots[0] : null;

  const isPwa = Boolean(app.pwaUrl || app.platform === "pwa");
  const platformLabel = isPwa
    ? "PWA / Web"
    : app.appStoreUrl && app.playStoreUrl
      ? "iOS & Android"
      : app.appStoreUrl
        ? "App Store"
        : app.playStoreUrl
          ? "Google Play"
          : app.platform === "cross-platform"
            ? "Cross-Platform"
            : "macOS";

  const actionText = isPwa ? "Launch" : "Get";

  return (
    <Link
      href={`/apps/${app.slug}`}
      className={cx(
        "group flex flex-col rounded-2xl overflow-hidden border border-black/5 bg-surface-container-lowest",
        "shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
        className,
      )}
    >
      {/* Thumbnail Graphic Header */}
      <div className={cx("relative h-36 w-full overflow-hidden bg-gradient-to-tr", gradient)}>
        {screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshot}
            alt={app.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            {/* Ambient decorative pattern */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-md shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="md" />
            </div>
          </div>
        )}

        {/* Star Rating or Protected Badge */}
        {!app.isPrivate ? (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[11px] font-bold shadow-sm">
            <StarIcon className="h-3 w-3 text-amber-300" />
            <span>{app.stars > 0 ? formatCount(app.stars) : "4.9"}</span>
          </div>
        ) : (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md px-2 py-0.5 rounded-full text-zinc-200 text-[11px] font-semibold shadow-sm">
            <LockIcon className="h-3 w-3 text-emerald-400" />
            <span>Proprietary</span>
          </div>
        )}

        {/* Platform tag */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-full text-on-surface text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <span>{platformLabel}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-surface-container p-0.5 flex items-center justify-center shadow-sm">
            <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
                {app.name}
              </h3>
              {app.verified && (
                <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-on-surface-variant">
              {app.tagline || excerpt(app.description, 90)}
            </p>
          </div>
        </div>

        {/* Footer Meta & Action Button */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-line/60">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted truncate">
            <span>{categoryName(app.category)}</span>
            {app.latestVersion && (
              <>
                <span className="text-outline-variant">•</span>
                <span>{app.latestVersion}</span>
              </>
            )}
          </div>

          <span className="shrink-0 px-3.5 py-1 rounded-full bg-surface-container-high group-hover:bg-primary text-primary group-hover:text-on-primary font-bold text-xs transition-all shadow-sm">
            {actionText}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function AppGrid({ apps }: { apps: App[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
