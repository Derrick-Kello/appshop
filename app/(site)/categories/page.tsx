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
    <>
      <div className="wash-soft -mt-19 rounded-b-3xl pt-19">
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-12 sm:pt-20">
          <h1 className="display text-[40px] sm:text-[52px]">Categories</h1>
          <p className="mt-4 max-w-xl text-[17px] leading-8 text-muted">
            Six shelves, chosen to match how people actually look for a Mac app
            rather than how app stores like to file them.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-5 sm:grid-cols-2">
          {counts.map(({ category, count }) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group rounded-2xl border border-line bg-canvas p-7 transition-shadow duration-200 hover:shadow-float"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-semibold tracking-tight text-ink">
                    {category.name}
                  </h2>
                  <p className="mt-2 max-w-sm text-[15px] leading-7 text-muted">
                    {category.blurb}
                  </p>
                </div>
                <ArrowIcon className="mt-1.5 h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-brand" />
              </div>
              <div className="mt-6">
                <Badge accent={category.accent}>
                  {count} app{count === 1 ? "" : "s"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
