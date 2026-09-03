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
    <>
      <div className="wash-soft -mt-19 rounded-b-3xl pt-19">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-5 pt-14 pb-12 sm:pt-20">
          {profile?.ownerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.ownerAvatar}
              alt=""
              className="h-20 w-20 rounded-full border border-line"
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-2xl font-semibold text-brand-ink">
              {handle.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div>
            <h1 className="display-sm text-[36px]">{profile?.ownerName || handle}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-muted">
              <a
                href={`https://github.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-ink"
              >
                <GitHubIcon className="h-4 w-4" />@{handle}
              </a>
              <span>
                {apps.length} app{apps.length === 1 ? "" : "s"}
              </span>
              {downloads > 0 && <span>{formatCount(downloads)} downloads</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-14">
        {apps.length > 0 ? (
          <AppGrid apps={apps} />
        ) : (
          <EmptyState title={`No published apps from @${handle} yet`}>
            When they list an app here, it shows up on this page.
          </EmptyState>
        )}
      </div>
    </>
  );
}
