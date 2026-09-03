import type { App } from "./types";

/**
 * The catalogue the store falls back to before Appwrite is wired up, and the
 * rows `npm run setup:appwrite -- --seed` writes on first run. Everything here
 * is real: the download buttons resolve against these repos' GitHub releases.
 */
const SEED: Omit<App, "id" | "createdAt" | "updatedAt">[] = [
  {
    slug: "crest",
    name: "Crest",
    tagline: "Your whole Mac, one click from the menu bar.",
    description: `Crest is one menu bar panel for the things you'd otherwise open five apps to check.

**Storage** that shows what is actually taking the space, and a cleaner that lists every file before it removes anything.

**System load** with CPU, memory, and a per-process breakdown you can act on.

**Battery health**, cycle count, and the charging behaviour macOS keeps to itself.

**Network** throughput, the interfaces you're on, and what is talking to the internet right now.

**Docker and Homebrew** containers, images, formulae and outdated packages, without a terminal.

**Clipboard history**, an ⌥Space command bar, and on-device dictation and meeting notes.

Nothing leaves your Mac. There is no main window and no account.`,
    category: "system",
    platform: "macos",
    repoOwner: "Derrick-Kello",
    repoName: "Crest",
    homepage: "https://crest-cyan-one.vercel.app/",
    iconUrl: "",
    screenshots: [],
    ownerId: "",
    ownerName: "Smart Hive Labs",
    ownerAvatar: "https://avatars.githubusercontent.com/u/224883136?v=4",
    ownerGithub: "Derrick-Kello",
    status: "published",
    featured: true,
    verified: true,
    downloads: 0,
    stars: 0,
    latestVersion: "",
    releasedAt: "",
    requirements: "macOS 14 or later",
    tags: ["menu bar", "system", "privacy", "cleaner"],
  },
  {
    slug: "workstation",
    name: "Workstation",
    tagline: "A macOS home for the code scattered around your Mac.",
    description: `Workstation groups your projects into named spaces, creates new ones from templates without opening a terminal, runs them, and hands the errors to a coding agent when they break.

**Workspaces.** One space per company, client or side-project bucket. Each owns a folder on disk where new projects are created.

**New projects without the terminal.** 21 templates across Apple, web, backend, mobile, data and tooling, with dependency search against npm, PyPI, crates.io and Maven Central.

**Import what you already have.** Point it at a folder and it works out what that folder is — a single project, six unrelated repos, or a monorepo it reads from \`workspaces\`, \`pnpm-workspace.yaml\`, Cargo \`[workspace]\` or \`go.work\`.

**Run panel.** Detects how each project starts and lists the options by type, each in its own output stream.

**Errors you can act on.** Compiler and runtime errors are pulled out of the stream with file, line and column, each with a button that opens Claude Code, Codex, Cursor Agent, Gemini, Aider or OpenCode in the project folder with the error already written out.

**Activity.** A year of commits as a heatmap, plus a language breakdown by bytes with lockfiles excluded.`,
    category: "developer-tools",
    platform: "macos",
    repoOwner: "Derrick-Kello",
    repoName: "workstation",
    homepage: "",
    iconUrl: "",
    screenshots: [],
    ownerId: "",
    ownerName: "Smart Hive Labs",
    ownerAvatar: "https://avatars.githubusercontent.com/u/224883136?v=4",
    ownerGithub: "Derrick-Kello",
    status: "published",
    featured: true,
    verified: true,
    downloads: 0,
    stars: 0,
    latestVersion: "",
    releasedAt: "",
    requirements: "macOS 26 or later",
    tags: ["projects", "swiftui", "agents", "templates"],
  },
];

export const SEED_APPS: App[] = SEED.map((app) => ({
  ...app,
  id: app.slug,
  createdAt: "",
  updatedAt: "",
}));
