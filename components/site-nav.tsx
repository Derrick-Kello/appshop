import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

import { ButtonLink, cx } from "./ui";
import { GitHubIcon } from "./icons";
import { SearchField } from "./search-field";
import { UserMenu } from "./user-menu";

const LINKS = [
  { href: "/apps", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/publish", label: "Publish" },
];

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cx(
                  "rounded-md px-2.5 py-1.5 text-[13px] text-mute",
                  "transition-colors hover:bg-elevated hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <SearchField className="hidden w-56 sm:block" />

          <a
            href="https://github.com/Derrick-Kello/appshop"
            target="_blank"
            rel="noreferrer"
            aria-label="Appshop on GitHub"
            className="hidden rounded-md p-2 text-ash transition-colors hover:bg-elevated hover:text-ink sm:block"
          >
            <GitHubIcon />
          </a>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
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

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("flex items-center gap-2", className)}>
      <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-accent-green to-[#1c7a52]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-canvas" fill="currentColor" aria-hidden>
          <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h2A1.5 1.5 0 0 1 8 4.5v2A1.5 1.5 0 0 1 6.5 8h-2A1.5 1.5 0 0 1 3 6.5v-2ZM3 9.5A1.5 1.5 0 0 1 4.5 8h2A1.5 1.5 0 0 1 8 9.5v2A1.5 1.5 0 0 1 6.5 13h-2A1.5 1.5 0 0 1 3 11.5v-2ZM9.5 3A1.5 1.5 0 0 0 8 4.5v2A1.5 1.5 0 0 0 9.5 8h2A1.5 1.5 0 0 0 13 6.5v-2A1.5 1.5 0 0 0 11.5 3h-2Z" />
        </svg>
      </span>
      <span className="display text-[15px] font-semibold tracking-tight text-ink">
        Appshop
      </span>
    </span>
  );
}
