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
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <nav className="mb-8 flex items-center gap-2 text-[15px] text-muted">
        <Link href="/dashboard" className="transition-colors hover:text-ink">
          Your apps
        </Link>
        <span className="text-ghost">/</span>
        <span className="text-ink">{app.name}</span>
      </nav>

      <header className="mb-10">
        <h1 className="display text-[40px] sm:text-[46px]">{app.name}</h1>
        <p className="mt-3 text-[16px] text-muted">
          Live at{" "}
          <Link
            href={`/apps/${app.slug}`}
            className="text-brand transition-colors hover:text-brand-deep"
          >
            /apps/{app.slug}
          </Link>
        </p>
      </header>

      <AppForm mode="edit" action={saveApp} app={app} />

      <Card className="mt-12 border-bad-line p-6">
        <h2 className="text-[17px] font-semibold text-ink">Remove this listing</h2>
        <p className="mt-2 max-w-lg text-[15px] leading-7 text-muted">
          Deletes the listing and its download counter. Your repository and its
          releases are untouched, so you can list it again any time.
        </p>
        <form action={removeApp} className="mt-5">
          <input type="hidden" name="id" value={app.id} />
          <Button type="submit" variant="danger" size="sm">
            Delete listing
          </Button>
        </form>
      </Card>
    </div>
  );
}
