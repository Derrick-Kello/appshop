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

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-hairline">
      <div aria-hidden className="hero-stripes pointer-events-none absolute inset-x-0 top-0 h-24 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Wordmark />
            <p className="mt-3 max-w-[22rem] text-[13px] leading-6 text-ash">
              A storefront for Mac apps that ship from GitHub. Listings live here,
              binaries stay in your releases.
            </p>
            <a
              href="https://github.com/Derrick-Kello/appshop"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[13px] text-mute transition-colors hover:text-ink"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              Source on GitHub
            </a>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[13px] font-medium text-ink">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-ash transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-[13px] font-medium text-ink">Browse</h2>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-[13px] text-ash transition-colors hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-hairline pt-6 text-[12px] text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>Smart Hive Labs · {new Date().getFullYear()}</p>
          <p>Every download resolves to a GitHub release. Appshop hosts no binaries.</p>
        </div>
      </div>
    </footer>
  );
}
