import { cx } from "./ui";

/**
 * Appshop stores no files, so most listings arrive without an icon. Rather than
 * a grey placeholder, a listing gets a stable generated mark in the pastel
 * register the Prepskora cards use: the same slug always produces the same
 * gradient, so the shelf stays recognisable between visits.
 */
function hueFrom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

const SIZES = {
  sm: "h-10 w-10 rounded-[12px] text-[15px]",
  md: "h-14 w-14 rounded-[16px] text-lg",
  lg: "h-20 w-20 rounded-[22px] text-2xl",
  xl: "h-24 w-24 rounded-[26px] text-3xl",
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
  const shell = cx("shrink-0 overflow-hidden", SIZES[size], className);

  if (src) {
    // Publisher-supplied URLs from arbitrary hosts, so this stays a plain img
    // rather than next/image — no remotePatterns allowlist to keep in sync.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden
        className={cx(shell, "border border-line object-cover")}
      />
    );
  }

  const hue = hueFrom(slug || name);

  return (
    <div
      aria-hidden
      className={cx(shell, "flex items-center justify-center font-semibold")}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 82% 93%), hsl(${(hue + 40) % 360} 72% 86%))`,
        color: `hsl(${hue} 48% 34%)`,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
