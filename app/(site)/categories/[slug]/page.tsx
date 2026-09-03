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
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <nav className="mb-6 text-[13px] text-stone">
        <Link href="/categories" className="transition-colors hover:text-ink">
          Categories
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mute">{category.name}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-2xl font-medium tracking-tight text-ink">{category.name}</h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-ash">{category.blurb}</p>
      </header>

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
  );
}
