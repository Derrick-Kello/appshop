import { archLabel, formatBytes, formatDate } from "@/lib/format";
import { pickBuild } from "@/lib/github";
import type { App, Release } from "@/lib/types";

import { AnchorButton, Badge, Card, cx } from "./ui";
import { AppleIcon, DownloadIcon, GitHubIcon, WarnIcon } from "./icons";

/**
 * The distribution surface. Appshop never proxies a binary — the primary button
 * hits our redirect route, which resolves the current release asset at request
 * time and sends the browser to GitHub. That means a publisher who ships a new
 * release has already updated this panel, with nothing to re-upload.
 */
export function DownloadPanel({
  app,
  release,
}: {
  app: App;
  release: Release | null;
}) {
  const repoUrl = `https://github.com/${app.repoOwner}/${app.repoName}`;

  if (!release) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <WarnIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <div className="text-[15px] leading-7">
            <p className="font-medium text-ink">No published release yet</p>
            <p className="mt-1 text-muted">
              This repository has no GitHub release with a downloadable build.
              Once its publisher tags one, the download appears here on its own.
            </p>
          </div>
        </div>
        <AnchorButton
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          variant="outline"
          className="mt-5 w-full"
        >
          <GitHubIcon />
          View repository
        </AnchorButton>
      </Card>
    );
  }

  // The same picker the redirect route uses, so this label always names the
  // file the button actually hands over.
  const primary = pickBuild(release.builds);
  const alternates = release.builds.filter((build) => build.url !== primary?.url);

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[15px] text-muted">
            <AppleIcon className="h-4 w-4" />
            macOS
          </span>
          <Badge accent={release.prerelease ? "warn" : "good"}>
            {release.prerelease ? "Pre-release" : "Latest"} · {release.tag}
          </Badge>
        </div>

        {primary ? (
          <>
            <AnchorButton href={`/api/download/${app.slug}`} size="lg" className="w-full">
              <DownloadIcon className="h-5 w-5" />
              Download for Mac
            </AnchorButton>
            <p className="mt-3 text-center text-[14px] text-muted">
              {archLabel(primary.arch)} · {primary.kind.toUpperCase()} ·{" "}
              {formatBytes(primary.size)}
            </p>
            <p className="mt-1 truncate text-center text-[13px] text-faint">
              {primary.name}
            </p>
          </>
        ) : (
          <>
            <AnchorButton
              href={release.url}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="lg"
              className="w-full"
            >
              <GitHubIcon />
              Open the release
            </AnchorButton>
            <p className="mt-3 text-center text-[14px] text-muted">
              This release has no .dmg, .pkg or .zip attached.
            </p>
          </>
        )}
      </div>

      {alternates.length > 0 && (
        <div className="border-t border-line p-6">
          <h3 className="mb-3 text-[14px] font-medium text-ink">Other builds</h3>
          <ul className="space-y-1">
            {alternates.map((build) => (
              <li key={build.url}>
                <a
                  href={build.url}
                  className={cx(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                    "text-[14px] text-body transition-colors hover:bg-surface hover:text-ink",
                  )}
                >
                  <span className="truncate">{build.name}</span>
                  <span className="shrink-0 text-muted">{formatBytes(build.size)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="border-t border-line text-[15px]">
        <Row label="Version">{release.tag}</Row>
        <Row label="Released">{formatDate(release.publishedAt)}</Row>
        {app.requirements && <Row label="Requires">{app.requirements}</Row>}
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

export function ReleaseHistory({ releases }: { releases: Release[] }) {
  if (releases.length === 0) return null;

  return (
    <ul className="space-y-1">
      {releases.map((release) => (
        <li key={release.tag}>
          <a
            href={release.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors hover:bg-surface"
          >
            <span className="text-ink">{release.tag}</span>
            <span className="text-[14px] text-muted">{formatDate(release.publishedAt)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
