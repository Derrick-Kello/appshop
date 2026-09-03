import type { Metadata } from "next";
import Link from "next/link";

import { AppGrid } from "@/components/app-card";
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
    <>
      <div className="wash-soft -mt-19 rounded-b-3xl pt-19">
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-14 sm:pt-20">
          <h1 className="display text-[40px] sm:text-[52px]">
            {q ? `Results for "${q}"` : "Browse apps"}
          </h1>
          <p className="mt-4 text-[17px] leading-8 text-muted">
            {apps.length === 0
              ? "Nothing here yet."
              : `${apps.length} app${apps.length === 1 ? "" : "s"}, every download resolved from a GitHub release.`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2">
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

        <div className="mb-10 flex items-center gap-2 border-b border-line pb-6">
          <span className="mr-1 text-[14px] text-muted">Sort</span>
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
                <ButtonLink href="/apps" variant="outline">
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
    </>
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
        "rounded-full px-4 py-2 text-[15px] transition-colors",
        active
          ? "bg-ink text-white"
          : "bg-surface text-body hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
