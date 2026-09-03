import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing behind these is useful to index, and the download route is a
      // redirect that would burn GitHub API budget on every crawl.
      disallow: ["/dashboard", "/api/", "/oauth", "/sign-in", "/sign-up"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
