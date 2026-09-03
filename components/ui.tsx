import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * One white pill anchors every primary action on the site; everything else is a
 * hairline ghost. Keeping the set this small is what makes the hierarchy read.
 */
const VARIANTS = {
  primary:
    "bg-ink text-canvas hover:bg-white disabled:bg-stone disabled:text-ash",
  secondary:
    "border border-hairline bg-elevated text-ink hover:border-hairline-strong hover:bg-card disabled:text-ash",
  ghost: "text-mute hover:bg-elevated hover:text-ink disabled:text-stone",
  danger:
    "border border-accent-red/30 bg-accent-red-soft text-accent-red hover:border-accent-red/60",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
} as const;

type ButtonStyle = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

function buttonClass({ variant = "primary", size = "md" }: ButtonStyle, extra?: string) {
  return cx(
    "inline-flex select-none items-center justify-center rounded-md font-medium",
    "transition-colors duration-150 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return <button className={buttonClass({ variant, size }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}

export function AnchorButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"a"> & ButtonStyle) {
  return <a className={buttonClass({ variant, size }, className)} {...props} />;
}

const ACCENTS = {
  green: "border-accent-green/25 bg-accent-green-soft text-accent-green",
  blue: "border-accent-blue/25 bg-accent-blue-soft text-accent-blue",
  red: "border-accent-red/25 bg-accent-red-soft text-accent-red",
  yellow: "border-accent-yellow/25 bg-accent-yellow-soft text-accent-yellow",
  purple: "border-accent-purple/25 bg-accent-purple-soft text-accent-purple",
  neutral: "border-hairline bg-elevated text-mute",
} as const;

export function Badge({
  accent = "neutral",
  className,
  children,
}: {
  accent?: keyof typeof ACCENTS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium tracking-tight whitespace-nowrap",
        ACCENTS[accent],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-hairline bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  optional,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-charcoal">{label}</span>
        {optional && <span className="text-[11px] text-stone">Optional</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[12px] text-accent-red">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] text-ash">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-md border border-hairline bg-surface px-3 text-sm text-ink " +
  "placeholder:text-stone transition-colors hover:border-hairline-strong " +
  "focus:border-accent-green/50 focus:outline-none disabled:text-ash";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(CONTROL, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cx(CONTROL, "resize-y py-2.5 leading-6", className)} {...props} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(CONTROL, "h-9 pr-8", className)} {...props} />;
}

/** A form-level message. Errors are announced; successes are not. */
export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-accent-red/25 bg-accent-red-soft text-accent-red",
    success: "border-accent-green/25 bg-accent-green-soft text-accent-green",
    info: "border-hairline bg-elevated text-mute",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cx("rounded-md border px-3 py-2.5 text-[13px]", tones[tone])}
    >
      {children}
    </p>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("py-12 sm:py-16", className)}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-lg font-medium tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-hairline px-6 py-14 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-6 text-ash">{children}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
