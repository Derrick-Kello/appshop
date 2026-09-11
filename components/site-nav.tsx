import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

import { ButtonLink, cx } from "./ui";
import { SearchField } from "./search-field";
import { UserMenu } from "./user-menu";


/**
 * Floating frosted pill navigation matching Stitch Luminous Design System.
 */
export async function SiteNav() {
  const user = await getCurrentUser();

  const links = user
    ? [
        { href: "/", label: "Overview" },
        { href: "/apps", label: "Curated Apps" },
        { href: "/categories", label: "Categories" },
        { href: "/dashboard", label: "Developer Studio" },
        { href: "/dashboard/new", label: "Publish App" },
      ]
    : [
        { href: "/", label: "Overview" },
        { href: "/apps", label: "Curated Apps" },
        { href: "/categories", label: "Categories" },
        { href: "/publish", label: "Publishing Guide" },
        { href: "/dashboard", label: "Developer Studio" },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 pointer-events-auto">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <Wordmark />
        </Link>

        {/* Floating Frosted Pill Nav Bar */}
        <nav
          className={cx(
            "hidden lg:flex items-center gap-1.5 p-1.5 rounded-full",
            "bg-surface-container-lowest/85 backdrop-blur-xl border border-black/5",
            "shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08),0_0_0_1px_rgba(0,0,0,0.04)]",
          )}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-tight transition-all duration-200",
                "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <SearchField className="hidden md:block w-48 xl:w-60" placeholder="Search apps & utilities..." />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-xl border border-black/5 text-xs font-semibold text-on-surface hover:bg-surface-container shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-good animate-pulse"></span>
                Console
              </Link>
              <UserMenu user={user} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonLink
                href="/sign-in"
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex rounded-full text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Log in
              </ButtonLink>
              <ButtonLink
                href="/sign-up"
                size="sm"
                className="rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-4 py-1.5 shadow-[0_4px_12px_rgba(0,74,198,0.25)] transition-all"
              >
                Sign up
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
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
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-primary to-primary-container shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            "text-[18px] font-extrabold tracking-tight",
            tone === "light" ? "text-white" : "text-on-surface",
          )}
        >
          Appshop
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-muted uppercase mt-0.5">
          Native Hub
        </span>
      </span>
    </span>
  );
}
