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

/** Full-bleed navy, closing the page the way the reference site does. */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-faint">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark tone="light" />
            <p className="mt-4 max-w-[24rem] text-[15px] leading-7 text-soft">
              A storefront for Mac apps that ship from GitHub. Listings live
              here, binaries stay in your releases.
            </p>
            <a
              href="https://github.com/Derrick-Kello/appshop"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[15px] text-faint transition-colors hover:text-white"
            >
              <GitHubIcon className="h-4 w-4" />
              Source on GitHub
            </a>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-[15px] font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-soft transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-[15px] font-semibold text-white">Browse</h2>
            <ul className="mt-4 space-y-3">
              {CATEGORIES.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-[15px] text-soft transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-[14px] text-soft sm:flex-row sm:items-center sm:justify-between">
          <p>Smart Hive Labs · {new Date().getFullYear()}</p>
          <p>Every download resolves to a GitHub release. Appshop hosts no binaries.</p>
        </div>
      </div>
    </footer>
  );
}
