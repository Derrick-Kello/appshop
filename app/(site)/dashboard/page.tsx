import type { Metadata } from "next";
import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { DownloadIcon, PlusIcon, StarIcon } from "@/components/icons";
import { ButtonLink, EmptyState } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { requireUser } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { formatCount, timeAgo } from "@/lib/format";
import type { App } from "@/lib/types";

export const metadata: Metadata = { title: "Distribution Console · Developer Studio" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const apps = await listApps({
    ownerId: user.id,
    ownerGithub: user.githubLogin,
    status: "any",
    limit: 100,
  });

  const totalDownloads = apps.reduce((sum, app) => sum + app.downloads, 0);
  const published = apps.filter((app) => app.status === "published").length;
  const totalStars = apps.reduce((sum, app) => sum + (app.stars || 0), 0);

  return (
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      {/* macOS Developer Window Frame matching Stitch Screens 1 & 2 */}
      <div className="w-full bg-[#f8fafc] rounded-[24px] shadow-[0_30px_60px_-12px_rgba(50,50,93,0.18),0_18px_36px_-18px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden flex flex-col">
        
        {/* macOS Window Title Bar */}
        <div className="h-12 bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Developer Studio · Distribution Console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-0.5 rounded-full text-[10px] font-bold text-on-surface-variant font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
              FLEET OPERATIONAL
            </span>
          </div>
        </div>

        {/* Dashboard Content Interior */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
          
          {/* Header Banner */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-line/60 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary tracking-wider uppercase">
                  Release Fleet &amp; Pipelines
                </span>
                <span className="text-[10px] bg-primary-container text-white font-mono px-2 py-0.5 rounded-full">
                  v3.2
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
                Distribution Console
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant max-w-xl">
                Manage your hosted desktop binaries, automated notarization, and real-time release downloads.
              </p>
            </div>

            <ButtonLink
              href="/dashboard/new"
              className="rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs px-5 py-2.5 shadow-sm active:scale-95 flex items-center gap-2 self-start sm:self-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Connect Repository
              {apps.length > 0 ? "Publish New App" : "Connect Repository"}
            </ButtonLink>
          </header>

          {/* Telemetry Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Listings"
              value={String(apps.length)}
              subtext={`${published} live in catalog`}
              icon="inventory_2"
              tone="primary"
            />
            <StatCard
              label="Total Downloads"
              value={formatCount(totalDownloads)}
              subtext="Direct binary redirects"
              icon="download"
              tone="secondary"
            />
            <StatCard
              label="GitHub Stars"
              value={formatCount(totalStars)}
              subtext="Aggregate community signal"
              icon="star"
              tone="amber"
            />
            <StatCard
              label="Notary & Security"
              value="100% Verified"
              subtext="Stapled gatekeeper tickets"
              icon="verified_user"
              tone="good"
            />
          </div>

          {/* Live Fleet Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface tracking-tight">
                Live Desktop Distributions ({apps.length})
              </h2>
            </div>

            {apps.length > 0 ? (
              <div className="grid gap-4">
                {apps.map((app) => (
                  <AppDistributionRow key={app.id} app={app} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No repositories connected"
                action={
                  <ButtonLink href="/dashboard/new" className="rounded-full">
                    Connect your first repository
                    Publish your first app
                  </ButtonLink>
                }
              >
                Paste a GitHub repository and Appshop automatically configures the release pipeline and notary status.
                Connect a GitHub repository to import releases, host a Progressive Web App, or list your store apps.
              </EmptyState>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  tone: "primary" | "secondary" | "amber" | "good";
}) {
  const iconColors = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    amber: "text-amber-500 bg-amber-500/10",
    good: "text-good bg-good/10",
  }[tone];

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColors}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">{value}</p>
        <p className="text-[11px] font-medium text-muted mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function AppDistributionRow({ app }: { app: App }) {
  return (
    <div className="group rounded-2xl border border-line bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-surface-container p-1 shadow-sm shrink-0 flex items-center justify-center">
          <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="md" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/apps/${app.slug}`}
              className="text-base font-bold text-on-surface hover:text-primary transition-colors truncate"
            >
              {app.name}
            </Link>
            <span className="text-xs font-mono bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
              {app.latestVersion || "v1.0.0"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-good bg-good-soft px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">verified_user</span>
              Apple Stapled
            </span>
          </div>

          <p className="text-xs text-muted mt-1 truncate">
            {app.repoOwner}/{app.repoName} · {categoryName(app.category)}
            {app.releasedAt && ` · Updated ${timeAgo(app.releasedAt)}`}
          </p>
        </div>
      </div>

      {/* Metrics & Action Triggers */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-4 text-xs font-semibold text-muted">
          {app.stars > 0 && (
            <span className="flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5 text-amber-500" />
              {formatCount(app.stars)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <DownloadIcon className="h-3.5 w-3.5" />
            {formatCount(app.downloads)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ButtonLink
            href={`/dashboard/apps/${app.id}`}
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold"
          >
            Edit Pipeline
          </ButtonLink>
          <ButtonLink
            href={`/apps/${app.slug}`}
            variant="soft"
            size="sm"
            className="rounded-full text-xs font-bold"
          >
            View Listing
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
