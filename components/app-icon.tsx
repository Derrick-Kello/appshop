import { cx } from "./ui";

/**
 * Appshop stores no files, so most listings arrive without an icon. Rather than
 * a grey placeholder, a listing gets a stable generated mark: the same slug
 * always produces the same hue pair, so the shelf stays recognisable between
 * visits and an app that later adds a real icon simply replaces it.
 */
function hueFrom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

const SIZES = {
  sm: "h-9 w-9 rounded-lg text-[13px]",
  md: "h-14 w-14 rounded-xl text-lg",
  lg: "h-20 w-20 rounded-[18px] text-2xl",
  xl: "h-28 w-28 rounded-[24px] text-4xl",
} as const;

export function AppIcon({
  name,
  slug,
  src,
  size = "md",
  className,
}: {
  name: string;
  slug: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shell = cx(
    "shrink-0 overflow-hidden border border-hairline-soft",
    SIZES[size],
    className,
  );

  if (src) {
    // Publisher-supplied URLs from arbitrary hosts, so this stays a plain img
    // rather than next/image — no remotePatterns allowlist to keep in sync.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" aria-hidden className={cx(shell, "object-cover")} />;
  }

  const hue = hueFrom(slug || name);

  return (
    <div
      aria-hidden
      className={cx(shell, "flex items-center justify-center font-medium text-white/90")}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 42% 34%), hsl(${(hue + 42) % 360} 38% 18%))`,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
