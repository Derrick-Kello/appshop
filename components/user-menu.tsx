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
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cx(
          "grid h-8 w-8 place-items-center overflow-hidden rounded-full border transition-colors",
          open ? "border-hairline-strong" : "border-hairline hover:border-hairline-strong",
        )}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="bg-elevated text-[12px] font-medium text-charcoal">{initial}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-56 overflow-hidden rounded-lg border border-hairline bg-elevated shadow-2xl shadow-black/60"
        >
          <div className="border-b border-hairline px-3.5 py-3">
            <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
            <p className="truncate text-[12px] text-ash">{user.email}</p>
          </div>

          <div className="p-1">
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

          <form action="/api/sign-out" method="post" className="border-t border-hairline p-1">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded-md px-2.5 py-2 text-left text-[13px] text-mute transition-colors hover:bg-card hover:text-ink"
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
      className="block rounded-md px-2.5 py-2 text-[13px] text-mute transition-colors hover:bg-card hover:text-ink"
    >
      {children}
    </Link>
  );
}
