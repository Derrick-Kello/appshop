import type { MetadataRoute } from "next";

import { listApps } from "@/lib/apps";
import { CATEGORIES } from "@/lib/categories";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apps = await listApps({ limit: 200 });

  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/apps`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site}/publish`, changeFrequency: "monthly", priority: 0.6 },
    ...CATEGORIES.map((category) => ({
      url: `${site}/categories/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...apps.map((app) => ({
      url: `${site}/apps/${app.slug}`,
      lastModified: app.updatedAt ? new Date(app.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
