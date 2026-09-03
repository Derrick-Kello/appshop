export type Category = {
  slug: string;
  name: string;
  blurb: string;
  accent: "brand" | "good" | "warn" | "bad" | "indigo" | "clay";
};

export const CATEGORIES: Category[] = [
  {
    slug: "developer-tools",
    name: "Developer Tools",
    blurb: "Editors, terminals, local servers and the things that run your code.",
    accent: "good",
  },
  {
    slug: "productivity",
    name: "Productivity",
    blurb: "Launchers, window managers, clipboard history, note-taking.",
    accent: "brand",
  },
  {
    slug: "utilities",
    name: "Utilities",
    blurb: "Menu bar tools, cleaners, converters, small sharp things.",
    accent: "warn",
  },
  {
    slug: "design",
    name: "Design",
    blurb: "Colour, type, screenshots, icons and asset pipelines.",
    accent: "indigo",
  },
  {
    slug: "media",
    name: "Media",
    blurb: "Audio, video, images, and the players and encoders around them.",
    accent: "bad",
  },
  {
    slug: "system",
    name: "System",
    blurb: "Monitors, disk tools, network inspectors, hardware readouts.",
    accent: "clay",
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function findCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryName(slug: string): string {
  return findCategory(slug)?.name ?? "Uncategorised";
}

/** Best-effort category from GitHub topics, used to prefill the import form. */
export function guessCategory(topics: string[], description: string): string {
  const haystack = [...topics, description].join(" ").toLowerCase();
  const rules: [string, RegExp][] = [
    ["developer-tools", /\b(dev|developer|cli|terminal|ide|editor|git|docker|compiler|sdk)\b/],
    ["design", /\b(design|figma|color|colour|icon|font|typography)\b/],
    ["media", /\b(video|audio|music|player|image|photo|ffmpeg|podcast)\b/],
    ["system", /\b(system|monitor|disk|network|cpu|memory|battery|hardware)\b/],
    ["productivity", /\b(productivity|launcher|window|clipboard|notes|todo|raycast|workflow)\b/],
    ["utilities", /\b(utility|utilities|menubar|menu-bar|tool|converter|cleaner)\b/],
  ];
  for (const [slug, pattern] of rules) {
    if (pattern.test(haystack)) return slug;
  }
  return "utilities";
}
