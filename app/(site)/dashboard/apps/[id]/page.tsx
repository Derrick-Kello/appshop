import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppForm } from "@/components/app-form";
import { Button, Card } from "@/components/ui";
import { getAppById } from "@/lib/apps";
import { requireUser } from "@/lib/auth";

import { removeApp, saveApp } from "../../actions";

export const metadata: Metadata = { title: "Edit listing" };
export const dynamic = "force-dynamic";

export default async function EditAppPage(props: PageProps<"/dashboard/apps/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/dashboard/apps/${id}`);

  const app = await getAppById(id);
  if (!app || app.ownerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <nav className="mb-6 text-[13px] text-stone">
        <Link href="/dashboard" className="transition-colors hover:text-ink">
          Your apps
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mute">{app.name}</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">{app.name}</h1>
          <p className="mt-1.5 text-[13px] text-ash">
            Live at{" "}
            <Link
              href={`/apps/${app.slug}`}
              className="text-mute underline decoration-hairline-strong underline-offset-2 hover:decoration-accent-green"
            >
              /apps/{app.slug}
            </Link>
          </p>
        </div>
      </header>

      <AppForm mode="edit" action={saveApp} app={app} />

      <Card className="mt-10 border-accent-red/20 p-5">
        <h2 className="text-[13px] font-medium text-ink">Remove this listing</h2>
        <p className="mt-1.5 max-w-lg text-[13px] leading-6 text-ash">
          Deletes the listing and its download counter. Your repository and its
          releases are untouched, so you can list it again any time.
        </p>
        <form action={removeApp} className="mt-4">
          <input type="hidden" name="id" value={app.id} />
          <Button type="submit" variant="danger" size="sm">
            Delete listing
          </Button>
        </form>
      </Card>
    </div>
  );
}
