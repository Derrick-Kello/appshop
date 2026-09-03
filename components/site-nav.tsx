import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

import { ButtonLink, cx } from "./ui";
import { SearchField } from "./search-field";
import { UserMenu } from "./user-menu";

const LINKS = [
  { href: "/apps", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/publish", label: "Publish" },
];

/**
 * A floating pill bar rather than a full-width band, matching the Prepskora
 * site. It sits over the page rather than boxing it in.
 */
export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        className={cx(
          "mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-full border border-line",
          "bg-canvas/85 px-3 shadow-float backdrop-blur-xl sm:gap-5 sm:px-5",
        )}
      >
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3.5 py-2 text-[15px] text-body transition-colors hover:bg-surface hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <SearchField className="hidden w-52 md:block lg:w-64" />

          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <ButtonLink
                href="/sign-in"
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Log in
              </ButtonLink>
              <ButtonLink href="/sign-up" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand">
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
          <path d="M3 4.6A1.6 1.6 0 0 1 4.6 3h1.8A1.6 1.6 0 0 1 8 4.6v1.8A1.6 1.6 0 0 1 6.4 8H4.6A1.6 1.6 0 0 1 3 6.4V4.6ZM3 9.6A1.6 1.6 0 0 1 4.6 8h1.8A1.6 1.6 0 0 1 8 9.6v1.8A1.6 1.6 0 0 1 6.4 13H4.6A1.6 1.6 0 0 1 3 11.4V9.6ZM9.6 3A1.6 1.6 0 0 0 8 4.6v1.8A1.6 1.6 0 0 0 9.6 8h1.8A1.6 1.6 0 0 0 13 6.4V4.6A1.6 1.6 0 0 0 11.4 3H9.6Z" />
        </svg>
      </span>
      <span
        className={cx(
          "text-[19px] font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        Appshop
      </span>
    </span>
  );
}
