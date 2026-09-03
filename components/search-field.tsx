"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { SearchIcon } from "./icons";
import { cx } from "./ui";

type Props = {
  className?: string;
  placeholder?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
};

function control(size: "md" | "lg") {
  return cx(
    "w-full rounded-full border border-line-strong bg-canvas text-ink",
    "placeholder:text-faint transition-colors hover:border-ghost",
    "focus:border-brand focus:outline-none",
    size === "lg" ? "h-13 pl-12 pr-5 text-[16px]" : "h-10 pl-10 pr-4 text-[15px]",
  );
}

function Field({ className, placeholder = "Search apps", size = "md", autoFocus }: Props) {
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
      <SearchIcon
        className={cx(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint",
          size === "lg" ? "left-4.5 h-5 w-5" : "left-3.5 h-4 w-4",
        )}
      />
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search apps"
        className={control(size)}
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
          <SearchIcon
            className={cx(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint",
              props.size === "lg" ? "left-4.5 h-5 w-5" : "left-3.5 h-4 w-4",
            )}
          />
          <div className={control(props.size ?? "md")} aria-hidden />
        </div>
      }
    >
      <Field {...props} />
    </Suspense>
  );
}
