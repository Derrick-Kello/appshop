import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppGrid } from "@/components/app-card";
import { GitHubIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { formatCount } from "@/lib/format";

export const revalidate = 600;

export async function generateMetadata(
  props: PageProps<"/developers/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  return {
    title: handle,
    description: `Mac apps published on Appshop by ${handle}.`,
  };
}

export default async function DeveloperPage(props: PageProps<"/developers/[handle]">) {
  const { handle } = await props.params;
  if (!/^[A-Za-z0-9-]{1,39}$/.test(handle)) notFound();

  // Publishers are identified by their GitHub login, so a profile is simply
  // every published listing whose repo or account points at that handle.
  const all = await listApps({ limit: 200 });
  const apps = all.filter(
    (app) =>
      app.ownerGithub.toLowerCase() === handle.toLowerCase() ||
      app.repoOwner.toLowerCase() === handle.toLowerCase(),
  );

  const profile = apps[0];
  const downloads = apps.reduce((sum, app) => sum + app.downloads, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header className="mb-10 flex flex-wrap items-center gap-5">
        {profile?.ownerAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.ownerAvatar}
            alt=""
            className="h-16 w-16 rounded-full border border-hairline"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full border border-hairline bg-elevated text-xl text-charcoal">
            {handle.slice(0, 1).toUpperCase()}
          </span>
        )}

        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">
            {profile?.ownerName || handle}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ash">
            <a
              href={`https://github.com/${handle}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <GitHubIcon className="h-3.5 w-3.5" />@{handle}
            </a>
            <span>
              {apps.length} app{apps.length === 1 ? "" : "s"}
            </span>
            {downloads > 0 && <span>{formatCount(downloads)} downloads</span>}
          </div>
        </div>
      </header>

      {apps.length > 0 ? (
        <AppGrid apps={apps} />
      ) : (
        <EmptyState title={`No published apps from @${handle} yet`}>
          When they list an app here, it shows up on this page.
        </EmptyState>
      )}
    </div>
  );
}
