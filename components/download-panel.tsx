import { archLabel, formatBytes, formatDate } from "@/lib/format";
import { pickBuild } from "@/lib/github";
import type { App, Release } from "@/lib/types";

import { AnchorButton, Badge, Card, cx } from "./ui";
import {
  AppleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GitHubIcon,
  GooglePlayIcon,
  LockIcon,
  PwaIcon,
  WarnIcon,
} from "./icons";

/**
 * The multi-channel distribution surface.
 * Supports direct Mac binary downloads, PWA web app launching, and App Store / Google Play links.
 */
export function DownloadPanel({
  app,
  release,
}: {
  app: App;
  release: Release | null;
}) {
  const repoUrl = `https://github.com/${app.repoOwner}/${app.repoName}`;
  const isPwa = Boolean(app.pwaUrl || app.platform === "pwa");
  const hasAppStore = Boolean(app.appStoreUrl);
  const hasPlayStore = Boolean(app.playStoreUrl);
  const hasStores = hasAppStore || hasPlayStore;

  const primary = release ? pickBuild(release.builds) : null;
  const alternates = release ? release.builds.filter((build) => build.url !== primary?.url) : [];

  return (
    <Card className="overflow-hidden space-y-0 shadow-md border border-line/60">
      <div className="p-6">
        {/* Header Badges */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[14px] font-bold text-on-surface">
            {isPwa ? (
              <>
                <PwaIcon className="h-4 w-4 text-primary" />
                Web / PWA
              </>
            ) : hasStores && !primary && !app.binaryUrl ? (
              <>
                <AppleIcon className="h-4 w-4 text-on-surface" />
                Mobile &amp; Stores
              </>
            ) : (
              <>
                <AppleIcon className="h-4 w-4 text-on-surface" />
                macOS
              </>
            )}
          </span>

          <div className="flex items-center gap-2">
            {app.isPrivate && (
              <Badge accent="neutral">
                <LockIcon className="h-3 w-3 mr-1 inline-block text-zinc-400" />
                Proprietary
              </Badge>
            )}
            {release && (
              <Badge accent={release.prerelease ? "warn" : "good"}>
                {release.prerelease ? "Pre-release" : "Latest"} · {release.tag}
              </Badge>
            )}
            {isPwa && !release && (
              <Badge accent="good">Cloud Ready</Badge>
            )}
          </div>
        </div>

        {/* Distribution Actions */}
        <div className="space-y-3">
          {/* PWA Direct Launch Button */}
          {app.pwaUrl && (
            <div>
              <AnchorButton
                href={app.pwaUrl}
                target="_blank"
                rel="noreferrer"
                size="lg"
                className="w-full bg-primary hover:bg-primary-container text-white font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <PwaIcon className="h-5 w-5" />
                <span>Launch Web App</span>
                <ExternalLinkIcon className="h-3.5 w-3.5 opacity-80" />
              </AnchorButton>
              <p className="mt-2 text-center text-[12px] text-muted">
                Runs in Chrome, Safari &amp; Arc. Installable to Dock.
              </p>
            </div>
          )}

          {/* Direct macOS / Binary Download */}
          {(primary || app.binaryUrl) && (
            <div className={app.pwaUrl ? "pt-3 border-t border-line/60" : ""}>
              <AnchorButton
                href={`/api/download/${app.slug}`}
                size="lg"
                className={cx(
                  "w-full flex items-center justify-center gap-2",
                  app.pwaUrl ? "bg-surface-container hover:bg-surface-container-high text-on-surface" : "",
                )}
              >
                <DownloadIcon className="h-5 w-5" />
                <span>{app.binaryUrl && !primary ? "Download Application" : "Download for Mac"}</span>
              </AnchorButton>
              <p className="mt-2 text-center text-[13px] text-muted">
                {primary
                  ? `${archLabel(primary.arch)} · ${primary.kind.toUpperCase()} · ${formatBytes(primary.size)}`
                  : "Direct binary download"}
              </p>
            </div>
          )}

          {/* Official Apple App Store Button */}
          {app.appStoreUrl && (
            <div className="pt-1">
              <a
                href={app.appStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-sm group"
              >
                <AppleIcon className="h-6 w-6 shrink-0" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-300">Download on the</span>
                  <span className="text-sm font-bold tracking-tight">App Store</span>
                </div>
              </a>
            </div>
          )}

          {/* Official Google Play Button */}
          {app.playStoreUrl && (
            <div className="pt-1">
              <a
                href={app.playStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-sm group"
              >
                <GooglePlayIcon className="h-5 w-5 shrink-0 text-white" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-300">GET IT ON</span>
                  <span className="text-sm font-bold tracking-tight">Google Play</span>
                </div>
              </a>
            </div>
          )}

          {/* Fallback when no direct release, no binaryUrl, no PWA, and no store links */}
          {!primary && !app.binaryUrl && !app.pwaUrl && !hasStores && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <WarnIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
                <div className="text-[14px] leading-6">
                  <p className="font-semibold text-on-surface">No release assets published yet</p>
                  <p className="mt-1 text-muted text-xs">
                    {app.isPrivate
                      ? "The developer has not attached a downloadable binary to this release yet."
                      : "This repository has no GitHub release binary attached yet."}
                  </p>
                </div>
              </div>
              {!app.isPrivate && (
                <AnchorButton
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  className="w-full"
                >
                  <GitHubIcon />
                  View repository
                </AnchorButton>
              )}
            </div>
          )}
        </div>
      </div>

      {alternates.length > 0 && (
        <div className="border-t border-line p-6">
          <h3 className="mb-3 text-[14px] font-medium text-ink">Other builds</h3>
          <ul className="space-y-1">
            {alternates.map((build) => {
              const downloadHref = app.isPrivate && build.assetId
                ? `/api/download/${app.slug}?assetId=${build.assetId}`
                : build.url;
              return (
                <li key={build.url || build.assetId}>
                  <a
                    href={downloadHref}
                    className={cx(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                      "text-[14px] text-body transition-colors hover:bg-surface hover:text-ink",
                    )}
                  >
                    <span className="truncate">{build.name}</span>
                    <span className="shrink-0 text-muted">{formatBytes(build.size)}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <dl className="border-t border-line text-[15px]">
        {release ? (
          <>
            <Row label="Version">{release.tag}</Row>
            <Row label="Released">{formatDate(release.publishedAt)}</Row>
          </>
        ) : app.latestVersion ? (
          <Row label="Version">{app.latestVersion}</Row>
        ) : null}
        {app.requirements && <Row label="Requires">{app.requirements}</Row>}
        {app.isPrivate ? (
          <Row label="Distribution">Proprietary Software</Row>
        ) : (
          <Row label="Source">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand transition-colors hover:text-brand-deep"
            >
              {app.repoOwner}/{app.repoName}
            </a>
          </Row>
        )}
      </dl>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 not-last:border-b not-last:border-line">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right text-ink">{children}</dd>
    </div>
  );
}

export function ReleaseHistory({
  releases,
  isPrivate,
}: {
  releases: Release[];
  isPrivate?: boolean;
}) {
  if (releases.length === 0) return null;

  return (
    <ul className="space-y-1">
      {releases.map((release) => (
        <li key={release.tag}>
          {isPrivate ? (
            <div className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px]">
              <span className="text-ink font-medium">{release.tag}</span>
              <span className="text-[14px] text-muted">{formatDate(release.publishedAt)}</span>
            </div>
          ) : (
            <a
              href={release.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors hover:bg-surface"
            >
              <span className="text-ink">{release.tag}</span>
              <span className="text-[14px] text-muted">{formatDate(release.publishedAt)}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

