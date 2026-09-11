import type { Build, Release, Repo } from "./types";

const API = "https://api.github.com";

/**
 * Appshop stores no binaries. Every download is a redirect to a GitHub release
 * asset, so this module is the whole distribution layer.
 */

class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export function cleanGitHubToken(raw?: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^(Bearer|token)\s+/i, "")
    .trim();
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "appshop",
  };
  const auth = cleanGitHubToken(token) || cleanGitHubToken(process.env.GITHUB_TOKEN);
  if (auth) {
    h.Authorization = `Bearer ${auth}`;
  }
  return h;
}

/**
 * Unauthenticated GitHub allows 60 requests an hour per IP. Caching by tag lets
 * a busy store page share one upstream call, and lets a publisher's edit expire
 * just their app's entries.
 */
async function gh<T>(
  path: string,
  {
    token,
    revalidate = 600,
    tags = [] as string[],
  }: { token?: string; revalidate?: number; tags?: string[] } = {},
): Promise<T> {
  const isAuth = Boolean(cleanGitHubToken(token));
  const fetchOptions: RequestInit = {
    headers: headers(token),
  };

  if (isAuth) {
    // Authenticated calls with user tokens must bypass the Next.js Data Cache.
    // Next.js keys cache by URL, which would cause an unauthenticated 404
    // to forever shadow a valid user token.
    fetchOptions.cache = "no-store";
  } else {
    fetchOptions.next = { revalidate, tags };
  }

  const res = await fetch(`${API}${path}`, fetchOptions);

  if (!res.ok) {
    const detail =
      res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0"
        ? "GitHub API rate limit reached. Set GITHUB_TOKEN to lift it to 5,000/hour."
        : `GitHub responded ${res.status}`;
    throw new GitHubError(detail, res.status);
  }

  return (await res.json()) as T;
}


/** Accepts a full URL, `owner/repo`, or a git remote, and normalises it. */
export function parseRepo(input: string): { owner: string; name: string } | null {
  const trimmed = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");
  if (!trimmed) return null;

  const url = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+)/i,
  );
  if (url) return { owner: url[1], name: url[2] };

  const ssh = trimmed.match(/^git@github\.com:([^/\s]+)\/([^/\s]+)$/i);
  if (ssh) return { owner: ssh[1], name: ssh[2] };

  const short = trimmed.match(/^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
  if (short) return { owner: short[1], name: short[2] };

  return null;
}

type RawRepo = {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  topics?: string[];
  license: { spdx_id: string } | null;
  archived: boolean;
  pushed_at: string;
  private: boolean;
  owner: { login: string; avatar_url: string; type: string };
};

export async function fetchRepo(owner: string, name: string, token?: string): Promise<Repo> {
  const raw = await gh<RawRepo>(`/repos/${owner}/${name}`, {
    token,
    tags: [`repo:${owner}/${name}`],
  });

  if (raw.private && !token && !process.env.GITHUB_TOKEN) {
    throw new GitHubError(
      "That repository is private. Provide a GitHub Access Token to connect it.",
      403,
    );
  }

  return {
    owner: raw.owner.login,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description ?? "",
    homepage: raw.homepage ?? "",
    stars: raw.stargazers_count,
    topics: raw.topics ?? [],
    license: raw.license?.spdx_id ?? "",
    ownerAvatar: raw.owner.avatar_url,
    ownerLogin: raw.owner.login,
    ownerType: raw.owner.type,
    archived: raw.archived,
    pushedAt: raw.pushed_at,
  };
}

type RawRelease = {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
  assets: {
    id: number;
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
    url: string;
  }[];
};

/** Classifies an asset filename into the pair of facts a download button needs. */
function classify(name: string): Pick<Build, "arch" | "kind"> {
  const lower = name.toLowerCase();

  const kind: Build["kind"] = lower.endsWith(".dmg")
    ? "dmg"
    : lower.endsWith(".pkg")
      ? "pkg"
      : lower.endsWith(".zip")
        ? "zip"
        : "other";

  const arch: Build["arch"] = /universal/.test(lower)
    ? "universal"
    : /arm64|aarch64|apple.?silicon|m1|m2|m3|m4/.test(lower)
      ? "apple-silicon"
      : /x86.?64|x64|intel|amd64/.test(lower)
        ? "intel"
        : "universal";

  return { arch, kind };
}

/** Installable Mac artifacts, best-first. Checksums and sources are dropped. */
function toBuilds(assets: RawRelease["assets"]): Build[] {
  const rank = { dmg: 0, pkg: 1, zip: 2, other: 3 };

  return assets
    .map((a) => ({
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
      downloadCount: a.download_count,
      assetId: a.id,
      ...classify(a.name),
    }))
    .filter((b) => b.kind !== "other" && !/\.(sha256|txt|asc|sig|json)$/i.test(b.name))
    .sort((a, b) => rank[a.kind] - rank[b.kind] || b.size - a.size);
}

/**
 * Chooses which build a download resolves to.
 *
 * Format wins over architecture: a universal .dmg is a better artifact than an
 * arm64 .zip, because a disk image is what a Mac user expects to mount and a
 * universal binary runs everywhere. Only once the best available format is
 * settled does architecture break the tie. Getting this order backwards served
 * zips to people the page had just promised a .dmg.
 *
 * Exported so `DownloadPanel` labels exactly what `/api/download` will serve.
 */
export function pickBuild(builds: Build[], requested?: string | null): Build | undefined {
  if (builds.length === 0) return undefined;

  // `toBuilds` already sorted by format rank, so the first entry names the best
  // format present in this release.
  const bestKind = builds[0].kind;
  const sameFormat = builds.filter((build) => build.kind === bestKind);

  const wanted: Build["arch"] | null =
    requested === "intel"
      ? "intel"
      : requested === "arm64" || requested === "apple-silicon"
        ? "apple-silicon"
        : null;

  // No explicit request: Apple silicon has been the default Mac for years.
  const preference: Build["arch"][] =
    wanted === "intel"
      ? ["intel", "universal"]
      : wanted === "apple-silicon"
        ? ["apple-silicon", "universal"]
        : ["apple-silicon", "universal"];

  for (const arch of preference) {
    const match = sameFormat.find((build) => build.arch === arch);
    if (match) return match;
  }

  // An Intel-only request with no Intel or universal build in the best format:
  // fall back across formats before giving up entirely.
  if (wanted) {
    for (const arch of preference) {
      const match = builds.find((build) => build.arch === arch);
      if (match) return match;
    }
  }

  return sameFormat[0] ?? builds[0];
}

export async function fetchLatestRelease(
  owner: string,
  name: string,
  token?: string,
): Promise<Release | null> {
  let raw: RawRelease;
  try {
    raw = await gh<RawRelease>(`/repos/${owner}/${name}/releases/latest`, {
      token,
      tags: [`releases:${owner}/${name}`],
    });
  } catch (error) {
    // A repo with no published release is a normal state, not a failure.
    if (error instanceof GitHubError && error.status === 404) return null;
    throw error;
  }

  return {
    tag: raw.tag_name,
    name: raw.name || raw.tag_name,
    notes: raw.body ?? "",
    publishedAt: raw.published_at,
    url: raw.html_url,
    prerelease: raw.prerelease,
    builds: toBuilds(raw.assets),
  };
}

export async function fetchReleases(
  owner: string,
  name: string,
  limit = 10,
  token?: string,
): Promise<Release[]> {
  const raw = await gh<RawRelease[]>(
    `/repos/${owner}/${name}/releases?per_page=${limit}`,
    { token, tags: [`releases:${owner}/${name}`] },
  );

  return raw
    .filter((r) => !r.draft)
    .map((r) => ({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      notes: r.body ?? "",
      publishedAt: r.published_at,
      url: r.html_url,
      prerelease: r.prerelease,
      builds: toBuilds(r.assets),
    }));
}

/** The README, used to prefill a long description at import time. */
export async function fetchReadme(
  owner: string,
  name: string,
  token?: string,
): Promise<string> {
  try {
    const raw = await gh<{ content: string; encoding: string }>(
      `/repos/${owner}/${name}/readme`,
      { token, tags: [`repo:${owner}/${name}`] },
    );
    if (raw.encoding !== "base64") return "";
    return Buffer.from(raw.content, "base64").toString("utf8");
  } catch {
    return "";
  }
}

/**
 * Resolves a signed binary download URL from GitHub for a private release asset.
 * GitHub returns a 302 Found redirect to a temporary Amazon S3 signed URL.
 * The visitor can download the binary directly without any GitHub account or repo access.
 */
export async function getPrivateAssetDownloadUrl(
  owner: string,
  name: string,
  assetId: number,
  token?: string,
): Promise<string | null> {
  const auth = token || process.env.GITHUB_TOKEN;
  if (!auth) return null;

  try {
    const res = await fetch(`${API}/repos/${owner}/${name}/releases/assets/${assetId}`, {
      headers: {
        Accept: "application/octet-stream",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "appshop",
        Authorization: `Bearer ${auth}`,
      },
      redirect: "manual",
    });

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get("location");
      if (location) return location;
    }

    if (res.ok) {
      return res.url;
    }

    return null;
  } catch (err) {
    console.error(`[appshop] Failed to get private asset URL:`, err);
    return null;
  }
}

/**
 * Finds an app icon inside the repository.
 *
 * Mac apps keep a real icon in the repo already — an `AppIcon.appiconset`, or a
 * `docs/icon.png` used by the README — so a listing should never have to fall
 * back to a generated monogram just because nobody pasted a URL. One recursive
 * tree call covers any layout, and the result is cached for a day.
 */
const ICON_RULES: [RegExp, number][] = [
  [/AppIcon\.appiconset\/[^/]*512x512@2x\.png$/i, 100],
  [/AppIcon\.appiconset\/[^/]*1024[^/]*\.png$/i, 96],
  [/AppIcon\.appiconset\/[^/]*512x512\.png$/i, 92],
  [/AppIcon\.appiconset\/[^/]*256x256@2x\.png$/i, 88],
  [/AppIcon\.appiconset\/.*\.png$/i, 70],
  [/(^|\/)(app-?)?icon\.png$/i, 66],
  [/(^|\/)logo\.png$/i, 60],
  [/(^|\/)(docs|assets|resources|art|media|images|\.github)\/[^/]*(icon|logo)[^/]*\.png$/i, 54],
  [/(icon|logo)[^/]*\.png$/i, 30],
];

/** Anything that is plainly a screenshot or a social card, not an app icon. */
const ICON_REJECT =
  /(screenshot|screen-?shot|banner|social|og-?image|preview|hero|cover|demo|feature)/i;

type TreeNode = { path: string; type: string; size?: number };

export type RepoMedia = {
  iconUrl: string;
  bannerUrl: string;
  screenshots: string[];
};

const BANNER_RULES: [RegExp, number][] = [
  // Top priority: explicitly named banner or cover in dedicated art/media/assets/docs folders
  [/(^|\/)(art|assets|media|docs|\.github|images)\/[^/]*(banner|cover|hero|header|showcase)[^/]*\.(png|jpe?g|webp)$/i, 100],
  // In root directory: banner, cover, hero, showcase
  [/^(banner|cover|hero|header|showcase)\.(png|jpe?g|webp)$/i, 90],
  // Social card / OpenGraph / preview images
  [/(^|\/)(art|assets|media|docs|\.github|images)\/[^/]*(og-?image|social|preview|feature)[^/]*\.(png|jpe?g|webp)$/i, 80],
  [/^(og-?image|social|preview|feature)\.(png|jpe?g|webp)$/i, 70],
  // Any banner filename anywhere in the repo
  [/[^/]*(banner|cover|hero)[^/]*\.(png|jpe?g|webp)$/i, 50],
];

const SCREENSHOT_DIR =
  /(^|\/)(screenshots|docs\/screenshots|assets\/screenshots|media\/screenshots|\.github\/screenshots|art\/screenshots)\//i;
const SCREENSHOT_FILE = /(screenshot|screen-?shot|preview|demo|window)/i;

function toRawUrl(owner: string, name: string, filePath: string): string {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${owner}/${name}/HEAD/${encoded}`;
}

export async function findRepoMedia(
  owner: string,
  name: string,
  token?: string,
): Promise<RepoMedia> {
  let tree: TreeNode[];
  try {
    const res = await gh<{ tree: TreeNode[] }>(
      `/repos/${owner}/${name}/git/trees/HEAD?recursive=1`,
      { token, revalidate: 86_400, tags: [`tree:${owner}/${name}`] },
    );
    tree = res.tree ?? [];
  } catch {
    return { iconUrl: "", bannerUrl: "", screenshots: [] };
  }

  let bestIcon: { path: string; score: number; size: number } | null = null;
  let bestBanner: { path: string; score: number; size: number } | null = null;
  const screenshotCandidates: { path: string; size: number }[] = [];

  for (const node of tree) {
    if (node.type !== "blob") continue;
    const size = node.size ?? 0;
    const p = node.path;

    // 1. Icon discovery
    if (/\.png$/i.test(p) && !ICON_REJECT.test(p)) {
      const rule = ICON_RULES.find(([pattern]) => pattern.test(p));
      if (rule) {
        const score = rule[1];
        if (!bestIcon || score > bestIcon.score || (score === bestIcon.score && size > bestIcon.size)) {
          bestIcon = { path: p, score, size };
        }
      }
    }

    // 2. Banner discovery
    if (/\.(png|jpe?g|webp)$/i.test(p)) {
      const bRule = BANNER_RULES.find(([pattern]) => pattern.test(p));
      if (bRule) {
        const score = bRule[1];
        if (!bestBanner || score > bestBanner.score || (score === bestBanner.score && size > bestBanner.size)) {
          bestBanner = { path: p, score, size };
        }
      }
    }

    // 3. Screenshot gallery discovery
    if (/\.(png|jpe?g|webp)$/i.test(p)) {
      if (SCREENSHOT_DIR.test(p) || SCREENSHOT_FILE.test(p)) {
        screenshotCandidates.push({ path: p, size });
      }
    }
  }

  const iconUrl = bestIcon ? toRawUrl(owner, name, bestIcon.path) : "";
  const bannerUrl = bestBanner ? toRawUrl(owner, name, bestBanner.path) : "";

  const chosenBannerPath = bestBanner?.path;
  const chosenIconPath = bestIcon?.path;

  const validScreenshots = screenshotCandidates
    .filter((s) => s.path !== chosenBannerPath && s.path !== chosenIconPath)
    .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" }))
    .map((s) => toRawUrl(owner, name, s.path));

  const finalScreenshots: string[] = [];
  if (bannerUrl) {
    finalScreenshots.push(bannerUrl);
  }
  for (const s of validScreenshots) {
    if (finalScreenshots.length >= 6) break;
    finalScreenshots.push(s);
  }

  return {
    iconUrl,
    bannerUrl: bannerUrl || (finalScreenshots[0] ?? ""),
    screenshots: finalScreenshots,
  };
}

export async function findRepoIcon(
  owner: string,
  name: string,
  token?: string,
): Promise<string> {
  const media = await findRepoMedia(owner, name, token);
  return media.iconUrl;
}

/**
 * Whether a GitHub login may publish a repo: they own it, or they have push
 * access to it. Anything else lists as unverified.
 */
export async function canPublish(
  login: string,
  owner: string,
  name: string,
  token?: string,
): Promise<boolean> {
  if (!login) return false;
  if (login.toLowerCase() === owner.toLowerCase()) return true;
  const auth = cleanGitHubToken(token) || cleanGitHubToken(process.env.GITHUB_TOKEN);
  if (!auth) return false;

  try {
    const perm = await gh<{ permission: string }>(
      `/repos/${owner}/${name}/collaborators/${login}/permission`,
      { token: auth, revalidate: 300 },
    );
    return perm.permission === "admin" || perm.permission === "write";
  } catch {
    return false;
  }
}

/** Rewrites relative README image paths so they resolve off the raw CDN. */
export function absolutiseReadme(markdown: string, owner: string, name: string): string {
  const base = `https://raw.githubusercontent.com/${owner}/${name}/HEAD/`;
  return markdown.replace(
    /(!\[[^\]]*\]\()(?!https?:\/\/|data:)\/?([^)\s]+)/g,
    (_m, prefix: string, path: string) => `${prefix}${base}${path}`,
  );
}

export { GitHubError };
