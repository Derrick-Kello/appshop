/** An app listing. Mirrors one row of the Appwrite `apps` table. */
export type App = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  platform: string;
  repoOwner: string;
  repoName: string;
  homepage: string;
  iconUrl: string;
  screenshots: string[];
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerGithub: string;
  status: AppStatus;
  featured: boolean;
  verified: boolean;
  downloads: number;
  stars: number;
  latestVersion: string;
  releasedAt: string;
  requirements: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type AppStatus = "draft" | "published" | "unlisted";

export type Profile = {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  githubLogin: string;
  website: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  githubLogin: string;
  avatarUrl: string;
};

/** A downloadable build resolved from a GitHub release asset. */
export type Build = {
  name: string;
  url: string;
  size: number;
  downloadCount: number;
  arch: "apple-silicon" | "intel" | "universal";
  kind: "dmg" | "pkg" | "zip" | "other";
};

export type Release = {
  tag: string;
  name: string;
  notes: string;
  publishedAt: string;
  url: string;
  prerelease: boolean;
  builds: Build[];
};

export type Repo = {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  homepage: string;
  stars: number;
  topics: string[];
  license: string;
  ownerAvatar: string;
  ownerLogin: string;
  ownerType: string;
  archived: boolean;
  pushedAt: string;
};
