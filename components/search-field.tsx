"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { SearchIcon } from "./icons";
import { cx } from "./ui";

type Props = {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

const CONTROL =
  "h-9 w-full rounded-md border border-hairline bg-surface pl-9 pr-3 text-sm text-ink " +
  "placeholder:text-stone transition-colors hover:border-hairline-strong " +
  "focus:border-accent-green/50 focus:outline-none";

function Field({ className, placeholder = "Search apps", autoFocus }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      className={cx("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        router.push(query ? `/apps?q=${encodeURIComponent(query)}` : "/apps");
      }}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone" />
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search apps"
        className={CONTROL}
      />
    </form>
  );
}

/**
 * Reading `?q=` to seed the input opts the subtree out of static rendering, so
 * the boundary lives here rather than at every call site — the nav appears on
 * pages that do prerender.
 */
export function SearchField(props: Props) {
  return (
    <Suspense
      fallback={
        <div className={cx("relative", props.className)}>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone" />
          <div className={CONTROL} aria-hidden />
        </div>
      }
    >
      <Field {...props} />
    </Suspense>
  );
}
