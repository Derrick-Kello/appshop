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

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "appshop",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
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
  { revalidate = 600, tags = [] as string[] } = {},
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: headers(),
    next: { revalidate, tags },
  });

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

export async function fetchRepo(owner: string, name: string): Promise<Repo> {
  const raw = await gh<RawRepo>(`/repos/${owner}/${name}`, {
    tags: [`repo:${owner}/${name}`],
  });

  if (raw.private) {
    throw new GitHubError("That repository is private. Appshop can only list public repos.", 404);
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
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
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
      ...classify(a.name),
    }))
    .filter((b) => b.kind !== "other" && !/\.(sha256|txt|asc|sig|json)$/i.test(b.name))
    .sort((a, b) => rank[a.kind] - rank[b.kind] || b.size - a.size);
}

export async function fetchLatestRelease(
  owner: string,
  name: string,
): Promise<Release | null> {
  let raw: RawRelease;
  try {
    raw = await gh<RawRelease>(`/repos/${owner}/${name}/releases/latest`, {
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
): Promise<Release[]> {
  const raw = await gh<RawRelease[]>(
    `/repos/${owner}/${name}/releases?per_page=${limit}`,
    { tags: [`releases:${owner}/${name}`] },
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
export async function fetchReadme(owner: string, name: string): Promise<string> {
  try {
    const raw = await gh<{ content: string; encoding: string }>(
      `/repos/${owner}/${name}/readme`,
      { tags: [`repo:${owner}/${name}`] },
    );
    if (raw.encoding !== "base64") return "";
    return Buffer.from(raw.content, "base64").toString("utf8");
  } catch {
    return "";
  }
}

/**
 * Whether a GitHub login may publish a repo: they own it, or they have push
 * access to it. Anything else lists as unverified.
 */
export async function canPublish(
  login: string,
  owner: string,
  name: string,
): Promise<boolean> {
  if (!login) return false;
  if (login.toLowerCase() === owner.toLowerCase()) return true;
  if (!process.env.GITHUB_TOKEN) return false;

  try {
    const perm = await gh<{ permission: string }>(
      `/repos/${owner}/${name}/collaborators/${login}/permission`,
      { revalidate: 300 },
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
