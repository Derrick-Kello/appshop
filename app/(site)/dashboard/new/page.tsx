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
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <nav className="mb-8 flex items-center gap-2 text-[15px] text-muted">
        <Link href="/dashboard" className="transition-colors hover:text-ink">
          Your apps
        </Link>
        <span className="text-ghost">/</span>
        <span className="text-ink">Publish</span>
      </nav>

      <header className="mb-10">
        <h1 className="display text-[40px] sm:text-[46px]">Publish an app</h1>
        <p className="mt-3 max-w-xl text-[16px] leading-8 text-muted">
          Start with the repository. Appshop reads its description, topics, README
          and latest release, then leaves you to correct whatever it got wrong.
        </p>
      </header>

      <AppForm mode="create" action={publishApp} />
    </div>
  );
}
