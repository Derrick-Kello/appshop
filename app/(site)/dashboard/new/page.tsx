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
      <header className="mb-8">
        <h1 className="display text-[40px] sm:text-[46px]">Publish an app</h1>
        <p className="mt-3 max-w-xl text-[16px] leading-8 text-muted">
          Start with the repository. Appshop reads its description, topics, README
          and latest release, then leaves you to correct whatever it got wrong.
        </p>
      </header>

      {/* AI Agent Setup Helper Tip */}
      <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface-container-low to-surface-container p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-on-surface">
              Need to organize your repo folders and release assets?
            </p>
            <p className="text-xs text-on-surface-variant">
              Give our <code className="font-mono text-primary font-bold">prompt.md</code> to Cursor, Claude, or Copilot to automate setup in seconds.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/publish"
            className="px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-all border border-line/60"
          >
            View Guide
          </Link>
          <a
            href="/prompt.md"
            download="appshop-prompt.md"
            className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs transition-all shadow-xs"
          >
            Download prompt.md
          </a>
        </div>
      </div>

      <AppForm mode="create" action={publishApp} />
    </div>
  );
}
