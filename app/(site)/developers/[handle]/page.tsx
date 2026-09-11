import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppGrid } from "@/components/app-card";
import { GitHubIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { formatCount } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata(
  props: PageProps<"/developers/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  return {
    title: `@${handle} · Developer Profile`,
    description: `Apps on Appshop published by @${handle}.`,
  };
}

export default async function DeveloperPage(props: PageProps<"/developers/[handle]">) {
  const { handle } = await props.params;
  if (!/^[A-Za-z0-9-]{1,39}$/.test(handle)) notFound();

  const all = await listApps({ limit: 200 });
  const apps = all.filter(
    (app) =>
      app.ownerGithub.toLowerCase() === handle.toLowerCase() ||
      app.repoOwner.toLowerCase() === handle.toLowerCase(),
  );

  const profile = apps[0];
  const downloads = apps.reduce((sum, app) => sum + app.downloads, 0);

  return (
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-8 border border-black/5">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-line/60 pb-8">
          {profile?.ownerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.ownerAvatar}
              alt=""
              className="h-20 w-20 rounded-2xl border border-line object-cover shadow-sm"
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-surface-container text-2xl font-bold text-primary shadow-sm">
              {handle.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">
                Verified Developer
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
              {profile?.ownerName || handle}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted">
              <a
                href={`https://github.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-on-surface hover:text-primary transition-colors"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                @{handle}
              </a>
              <span className="text-outline-variant">•</span>
              <span>
                {apps.length} curated app{apps.length === 1 ? "" : "s"}
              </span>
              {downloads > 0 && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span>{formatCount(downloads)} downloads</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        {apps.length > 0 ? (
          <AppGrid apps={apps} />
        ) : (
          <EmptyState title={`No published apps from @${handle} yet`}>
            When they list an app here, it shows up on this page.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
