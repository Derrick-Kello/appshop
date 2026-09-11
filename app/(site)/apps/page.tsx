import type { Metadata } from "next";
import Link from "next/link";

import { AppGrid } from "@/components/app-card";
import { ButtonLink, EmptyState, cx } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Curated Directory · Browse Apps",
  description: "Every Mac & cross-platform app on Appshop, searchable by name, category, and release stream.",
};

export const revalidate = 300;

const SORTS = [
  { key: "recent", label: "Recent" },
  { key: "popular", label: "Popular" },
  { key: "name", label: "A–Z" },
] as const;

const PLATFORMS = [
  { key: "", label: "All Platforms" },
  { key: "macos", label: "macOS Native" },
  { key: "pwa", label: "PWA & Web" },
  { key: "mobile", label: "Mobile / Stores" },
] as const;

type Sort = (typeof SORTS)[number]["key"];

export default async function BrowsePage(props: PageProps<"/apps">) {
  const params = await props.searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const platform = typeof params.platform === "string" ? params.platform : "";
  const sort: Sort =
    params.sort === "popular" || params.sort === "name" ? params.sort : "recent";

  const apps = await listApps({ search: q, category, platform, sort, limit: 60 });

  const query = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (platform) next.set("platform", platform);
    if (sort !== "recent") next.set("sort", sort);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const string = next.toString();
    return string ? `/apps?${string}` : "/apps";
  };

  return (
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-5 sm:p-8 lg:p-10 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-8 border border-black/5">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line/60 pb-6">
          <div>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Native Distribution Catalogue
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
              {q ? `Results for "${q}"` : "Curated Directory"}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant max-w-xl">
              {apps.length === 0
                ? "No apps listed in this slice."
                : `Showing ${apps.length} curated app${apps.length === 1 ? "" : "s"} — verified, notarized, PWAs, and direct store listings.`}
            </p>
          </div>

          {/* Sort Pills */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs font-semibold text-muted mr-1">Sort by:</span>
            {SORTS.map((option) => (
              <Chip
                key={option.key}
                href={query({ sort: option.key === "recent" ? "" : option.key })}
                active={sort === option.key}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Filter Bars (Platform & Category) */}
        <div className="flex flex-col gap-3">
          {/* Platform Segmented Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            <span className="text-xs font-semibold text-muted mr-1.5 shrink-0">Platform:</span>
            {PLATFORMS.map((item) => (
              <Chip
                key={item.key}
                href={query({ platform: item.key })}
                active={platform === item.key}
              >
                {item.label}
              </Chip>
            ))}
          </div>

          {/* Category Horizontal Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar pt-2 border-t border-line/40">
            <span className="text-xs font-semibold text-muted mr-1.5 shrink-0">Category:</span>
            <Chip href={query({ category: "" })} active={!category}>
              All Categories
            </Chip>
            {CATEGORIES.map((item) => (
              <Chip
                key={item.slug}
                href={query({ category: item.slug })}
                active={category === item.slug}
              >
                {item.name}
              </Chip>
            ))}
          </div>
        </div>

        {/* 4-Column Card Grid */}
        {apps.length > 0 ? (
          <AppGrid apps={apps} />
        ) : (
          <EmptyState
            title={q ? `No app matches "${q}"` : "No apps in this category yet"}
            action={
              q ? (
                <ButtonLink href="/apps" variant="outline" className="rounded-full">
                  Clear search
                </ButtonLink>
              ) : (
                <ButtonLink href="/dashboard/new" className="rounded-full">
                  Publish the first app
                </ButtonLink>
              )
            }
          >
            {q
              ? "Try searching for a different keyword or app name."
              : "Point a GitHub repository at Appshop to automatically publish."}
          </EmptyState>
        )}
      </div>
    </main>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200",
        active
          ? "bg-primary-container text-white shadow-sm"
          : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high",
      )}
    >
      {children}
    </Link>
  );
}
