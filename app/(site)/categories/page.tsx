import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "@/components/icons";
import { listApps } from "@/lib/apps";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories · Curated Directory",
  description: "Browse curated native apps on Appshop by category and workflow.",
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
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-8 border border-black/5">
        
        <div className="border-b border-line/60 pb-6">
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            Curated Native Taxonomy
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
            Browse by Category
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-xl">
            Shelves chosen to match how developers and power users actually discover desktop utilities.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map(({ category, count }) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  <ArrowIcon className="mt-1 h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                  {category.blurb}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">
                  {count} {count === 1 ? "app" : "apps"} listed
                </span>
                <span className="text-xs font-bold text-primary group-hover:underline">
                  View category &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
