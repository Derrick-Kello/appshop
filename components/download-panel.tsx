import { archLabel, formatBytes, formatDate } from "@/lib/format";
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
      <Card className="p-5">
        <div className="flex items-start gap-2.5 text-mute">
          <WarnIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-yellow" />
          <div className="text-[13px] leading-6">
            <p className="font-medium text-ink">No published release yet</p>
            <p className="mt-1 text-ash">
              This repository has no GitHub release with a downloadable build.
              Once its publisher tags one, the download appears here on its own.
            </p>
          </div>
        </div>
        <AnchorButton
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          variant="secondary"
          className="mt-4 w-full"
        >
          <GitHubIcon />
          View repository
        </AnchorButton>
      </Card>
    );
  }

  const [primary, ...alternates] = release.builds;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-hairline p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] text-mute">
            <AppleIcon className="h-3.5 w-3.5" />
            macOS
          </span>
          <Badge accent={release.prerelease ? "yellow" : "green"}>
            {release.prerelease ? "Pre-release" : "Latest"} · {release.tag}
          </Badge>
        </div>

        {primary ? (
          <>
            <AnchorButton href={`/api/download/${app.slug}`} size="lg" className="w-full">
              <DownloadIcon />
              Download for Mac
            </AnchorButton>
            <p className="mt-2.5 text-center text-[12px] text-stone">
              {archLabel(primary.arch)} · {primary.kind.toUpperCase()} ·{" "}
              {formatBytes(primary.size)}
            </p>
          </>
        ) : (
          <>
            <AnchorButton
              href={release.url}
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <GitHubIcon />
              Open the release
            </AnchorButton>
            <p className="mt-2.5 text-center text-[12px] text-stone">
              This release has no .dmg, .pkg or .zip attached.
            </p>
          </>
        )}
      </div>

      {alternates.length > 0 && (
        <div className="border-b border-hairline p-5">
          <h3 className="mb-2.5 text-[12px] font-medium tracking-wide text-ash uppercase">
            Other builds
          </h3>
          <ul className="space-y-1">
            {alternates.map((build) => (
              <li key={build.url}>
                <a
                  href={build.url}
                  className={cx(
                    "flex items-center justify-between gap-3 rounded-md px-2.5 py-2",
                    "text-[13px] text-mute transition-colors hover:bg-elevated hover:text-ink",
                  )}
                >
                  <span className="truncate">{build.name}</span>
                  <span className="shrink-0 text-[12px] text-stone">
                    {formatBytes(build.size)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="divide-y divide-hairline text-[13px]">
        <Row label="Version">
          <span className="font-mono text-charcoal">{release.tag}</span>
        </Row>
        <Row label="Released">{formatDate(release.publishedAt)}</Row>
        {app.requirements && <Row label="Requires">{app.requirements}</Row>}
        <Row label="Source">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-charcoal underline decoration-hairline-strong underline-offset-2 hover:decoration-accent-green"
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
    <div className="flex items-center justify-between gap-4 px-5 py-2.5">
      <dt className="text-ash">{label}</dt>
      <dd className="truncate text-right text-mute">{children}</dd>
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
            className="flex items-baseline justify-between gap-3 rounded-md px-2.5 py-2 text-[13px] transition-colors hover:bg-elevated"
          >
            <span className="font-mono text-charcoal">{release.tag}</span>
            <span className="text-[12px] text-stone">{formatDate(release.publishedAt)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
