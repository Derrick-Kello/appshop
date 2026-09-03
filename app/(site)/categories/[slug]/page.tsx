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

  return { title: category.name, description: category.blurb };
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const category = findCategory(slug);
  if (!category) notFound();

  const apps = await listApps({ category: slug, limit: 60 });

  return (
    <>
      <div className="wash-soft -mt-19 rounded-b-3xl pt-19">
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:pt-16">
          <nav className="mb-8 flex items-center gap-2 text-[15px] text-muted">
            <Link href="/categories" className="transition-colors hover:text-ink">
              Categories
            </Link>
            <span className="text-ghost">/</span>
            <span className="text-ink">{category.name}</span>
          </nav>

          <h1 className="display text-[40px] sm:text-[52px]">{category.name}</h1>
          <p className="mt-4 max-w-xl text-[17px] leading-8 text-muted">{category.blurb}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-14">
        {apps.length > 0 ? (
          <AppGrid apps={apps} />
        ) : (
          <EmptyState
            title={`Nothing in ${category.name} yet`}
            action={<ButtonLink href="/dashboard/new">Publish an app</ButtonLink>}
          >
            This shelf is waiting for its first listing.
          </EmptyState>
        )}
      </div>
    </>
  );
}
