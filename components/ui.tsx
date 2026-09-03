import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Controls are pills, matching the Prepskora site. One solid blue carries the
 * primary action on any given view; everything else steps down to a blue tint,
 * an outline, or plain text.
 */
const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-deep disabled:bg-ghost",
  soft: "bg-brand-soft text-brand-ink hover:bg-brand-line disabled:text-faint",
  outline:
    "border border-line-strong bg-canvas text-ink hover:border-ghost hover:bg-surface disabled:text-faint",
  ghost: "text-muted hover:bg-surface hover:text-ink disabled:text-ghost",
  danger: "border border-bad-line bg-bad-soft text-bad hover:bg-bad-line/40",
} as const;

const SIZES = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-[17px] gap-2.5",
} as const;

type ButtonStyle = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

function buttonClass({ variant = "primary", size = "md" }: ButtonStyle, extra?: string) {
  return cx(
    "inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium",
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
  brand: "bg-brand-soft text-brand-ink",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  indigo: "bg-indigo-soft text-indigo",
  clay: "bg-clay-soft text-clay",
  neutral: "bg-surface-2 text-muted",
} as const;

export type Accent = keyof typeof ACCENTS;

export function Badge({
  accent = "neutral",
  className,
  children,
}: {
  accent?: Accent;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "text-[13px] font-medium whitespace-nowrap",
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
    <div className={cx("rounded-2xl border border-line bg-canvas", className)}>
      {children}
    </div>
  );
}

/** A tinted panel, the way the reference site separates one section from the next. */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx("rounded-3xl bg-surface", className)}>{children}</div>;
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
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium text-ink">{label}</span>
        {optional && <span className="text-[13px] text-faint">Optional</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-[13px] text-bad">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-[13px] leading-5 text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-xl border border-line-strong bg-canvas px-4 text-[15px] text-ink " +
  "placeholder:text-faint transition-colors hover:border-ghost " +
  "focus:border-brand focus:outline-none disabled:bg-surface disabled:text-faint";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(CONTROL, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cx(CONTROL, "resize-y py-3 leading-7", className)} {...props} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(CONTROL, "h-11 pr-10", className)} {...props} />;
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
    error: "bg-bad-soft text-bad",
    success: "bg-good-soft text-good",
    info: "bg-surface-2 text-muted",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cx("rounded-xl px-4 py-3 text-[14px] leading-6", tones[tone])}
    >
      {children}
    </p>
  );
}

export function Section({
  title,
  lede,
  action,
  children,
  className,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("py-14 sm:py-20", className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display-sm text-[26px] sm:text-[30px]">{title}</h2>
          {lede && <p className="mt-2 max-w-xl text-[15px] leading-7 text-muted">{lede}</p>}
        </div>
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
    <div className="rounded-3xl bg-surface px-6 py-16 text-center">
      <p className="text-[18px] font-medium text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-7 text-muted">{children}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
