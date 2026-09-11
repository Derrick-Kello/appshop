import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppGrid } from "@/components/app-card";
import { ButtonLink, EmptyState } from "@/components/ui";
import { listApps } from "@/lib/apps";
import { CATEGORIES, findCategory } from "@/lib/categories";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(
  props: PageProps<"/categories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = findCategory(slug);
  if (!category) return { title: "Category not found" };

  return { title: `${category.name} · Curated Native Directory`, description: category.blurb };
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const category = findCategory(slug);
  if (!category) notFound();

  const apps = await listApps({ category: slug, limit: 60 });

  return (
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-6 sm:p-10 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-8 border border-black/5">
        
        <div className="border-b border-line/60 pb-6">
          <nav className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted">
            <Link href="/categories" className="hover:text-primary transition-colors">
              Categories
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface">{category.name}</span>
          </nav>

          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            Curated Category
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
            {category.name}
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-xl">
            {category.blurb}
          </p>
        </div>

        {apps.length > 0 ? (
          <AppGrid apps={apps} />
        ) : (
          <EmptyState
            title={`No apps in ${category.name} yet`}
            action={<ButtonLink href="/dashboard/new" className="rounded-full">Publish the first app</ButtonLink>}
          >
            This shelf is ready for its first verified GitHub release listing.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
