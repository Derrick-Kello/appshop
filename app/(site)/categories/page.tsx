import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Mac apps on Appshop by what they actually do.",
};

export const revalidate = 600;

export default async function CategoriesPage() {
  const counts = await Promise.all(
    CATEGORIES.map(async (category) => ({
      category,
      count: (await listApps({ category: category.slug, limit: 100 })).length,
    })),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-2xl font-medium tracking-tight text-ink">Categories</h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-ash">
          Six shelves, chosen to match how people actually look for a Mac app
          rather than how app stores like to file them.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {counts.map(({ category, count }) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="group rounded-xl border border-hairline bg-card p-6 transition-colors hover:border-hairline-strong hover:bg-elevated"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-medium tracking-tight text-ink">
                  {category.name}
                </h2>
                <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-ash">
                  {category.blurb}
                </p>
              </div>
              <ArrowIcon className="mt-1 h-4 w-4 shrink-0 text-stone transition-colors group-hover:text-ink" />
            </div>
            <div className="mt-5">
              <Badge accent={category.accent}>
                {count} app{count === 1 ? "" : "s"}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
