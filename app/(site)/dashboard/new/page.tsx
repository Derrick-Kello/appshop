import type { Metadata } from "next";
import Link from "next/link";

import { AppForm } from "@/components/app-form";
import { requireUser } from "@/lib/auth";

import { publishApp } from "../actions";

export const metadata: Metadata = { title: "Publish an app" };
export const dynamic = "force-dynamic";

export default async function NewAppPage() {
  await requireUser("/dashboard/new");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <nav className="mb-6 text-[13px] text-stone">
        <Link href="/dashboard" className="transition-colors hover:text-ink">
          Your apps
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mute">Publish</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-ink">Publish an app</h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-ash">
          Start with the repository. Appshop reads its description, topics, README
          and latest release, then leaves you to correct whatever it got wrong.
        </p>
      </header>

      <AppForm mode="create" action={publishApp} />
    </div>
  );
}
