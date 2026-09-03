import type { Metadata } from "next";
import Link from "next/link";

import { AppGrid } from "@/components/app-card";
import { SearchField } from "@/components/search-field";
import { ButtonLink, EmptyState, cx } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Browse apps",
  description: "Every Mac app on Appshop, searchable by name, category and release date.",
};

export const revalidate = 300;

const SORTS = [
  { key: "recent", label: "Recent" },
  { key: "popular", label: "Popular" },
  { key: "name", label: "A–Z" },
] as const;

type Sort = (typeof SORTS)[number]["key"];

export default async function BrowsePage(props: PageProps<"/apps">) {
  const params = await props.searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort: Sort =
    params.sort === "popular" || params.sort === "name" ? params.sort : "recent";

  const apps = await listApps({ search: q, category, sort, limit: 60 });

  const query = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (sort !== "recent") next.set("sort", sort);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const string = next.toString();
    return string ? `/apps?${string}` : "/apps";
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-ink">
          {q ? `Results for "${q}"` : "Browse apps"}
        </h1>
        <p className="mt-1.5 text-[13px] text-ash">
          {apps.length === 0
            ? "Nothing here yet."
            : `${apps.length} app${apps.length === 1 ? "" : "s"}, every download resolved from a GitHub release.`}
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-4 border-b border-hairline pb-6 lg:flex-row lg:items-center lg:justify-between">
        <SearchField className="w-full lg:w-80" />

        <div className="flex flex-wrap items-center gap-1">
          <Chip href={query({ category: "" })} active={!category}>
            All
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

      <div className="mb-6 flex items-center gap-1">
        <span className="mr-1 text-[12px] text-stone">Sort</span>
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

      {apps.length > 0 ? (
        <AppGrid apps={apps} />
      ) : (
        <EmptyState
          title={q ? `No app matches "${q}"` : "No apps in this slice yet"}
          action={
            q ? (
              <ButtonLink href="/apps" variant="secondary">
                Clear the search
              </ButtonLink>
            ) : (
              <ButtonLink href="/dashboard/new">Publish an app</ButtonLink>
            )
          }
        >
          {q
            ? "Try a shorter query, or browse a category instead."
            : "Point a GitHub repository at Appshop and it lands here."}
        </EmptyState>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "rounded-full px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-ink text-canvas"
          : "text-mute hover:bg-elevated hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
