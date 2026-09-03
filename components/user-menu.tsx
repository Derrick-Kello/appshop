"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { SessionUser } from "@/lib/types";

import { cx } from "./ui";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (user.name || user.email).slice(0, 1).toUpperCase();

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cx(
          "grid h-10 w-10 place-items-center overflow-hidden rounded-full border transition-colors",
          open ? "border-brand" : "border-line-strong hover:border-ghost",
        )}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-brand-soft text-[15px] font-medium text-brand-ink">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-12 right-0 w-60 overflow-hidden rounded-2xl border border-line bg-canvas shadow-pop"
        >
          <div className="border-b border-line px-4 py-3.5">
            <p className="truncate text-[15px] font-medium text-ink">{user.name}</p>
            <p className="truncate text-[13px] text-muted">{user.email}</p>
          </div>

          <div className="p-1.5">
            <MenuLink href="/dashboard" onNavigate={() => setOpen(false)}>
              Your apps
            </MenuLink>
            <MenuLink href="/dashboard/new" onNavigate={() => setOpen(false)}>
              Publish an app
            </MenuLink>
            {user.githubLogin && (
              <MenuLink
                href={`/developers/${user.githubLogin}`}
                onNavigate={() => setOpen(false)}
              >
                Public profile
              </MenuLink>
            )}
          </div>

          <form action="/api/sign-out" method="post" className="border-t border-line p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded-lg px-3 py-2.5 text-left text-[15px] text-body transition-colors hover:bg-surface hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="block rounded-lg px-3 py-2.5 text-[15px] text-body transition-colors hover:bg-surface hover:text-ink"
    >
      {children}
    </Link>
  );
}
