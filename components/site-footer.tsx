import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

import { GitHubIcon } from "./icons";
import { Wordmark } from "./site-nav";

const COLUMNS = [
  {
    title: "Store",
    links: [
      { href: "/apps", label: "All apps" },
      { href: "/apps?sort=popular", label: "Most downloaded" },
      { href: "/apps?sort=recent", label: "Recently updated" },
      { href: "/categories", label: "Categories" },
    ],
  },
  {
    title: "Publishers",
    links: [
      { href: "/publish", label: "How publishing works" },
      { href: "/dashboard/new", label: "Publish an app" },
      { href: "/dashboard", label: "Your apps" },
      { href: "/sign-up", label: "Create an account" },
    ],
  },
];

/** Luminous frosted footer matching Stitch Design System. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-container-lowest/80 backdrop-blur-xl text-on-surface-variant">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Wordmark tone="dark" />
            <p className="mt-4 max-w-[22rem] text-[14px] leading-6 text-on-surface-variant">
              Next-generation cross-platform app distribution portal. Point your GitHub repo once;
              every tagged release turns into an instant verified download.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/Derrick-Kello/appshop"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                <GitHubIcon className="h-4 w-4" />
                GitHub Repository
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[13px] font-bold tracking-wider uppercase text-on-surface">{column.title}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-[13px] font-bold tracking-wider uppercase text-on-surface">Categories</h2>
            <ul className="mt-3.5 space-y-2.5">
              {CATEGORIES.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-[14px] text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line/60 pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">Appshop</span>
            <span className="text-outline-variant">•</span>
            <span>Next-Gen App Distribution Ecosystem</span>
          </div>
          <p>Every download resolves to a signed release. No binaries in the middle.</p>
        </div>
      </div>
    </footer>
  );
}
