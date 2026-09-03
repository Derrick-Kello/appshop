import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { guessCategory } from "@/lib/categories";
import { slugify } from "@/lib/format";
import {
  GitHubError,
  absolutiseReadme,
  canPublish,
  fetchLatestRelease,
  fetchReadme,
  fetchRepo,
  findRepoIcon,
  parseRepo,
} from "@/lib/github";

/**
 * Backs the "paste a repo URL" step of publishing: everything Appshop can work
 * out about a repository on its own, so the publisher only fills in what GitHub
 * cannot tell us.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const input = request.nextUrl.searchParams.get("repo") ?? "";
  const parsed = parseRepo(input);
  if (!parsed) {
    return NextResponse.json(
      { error: "That doesn't look like a GitHub repository. Try github.com/owner/repo." },
      { status: 400 },
    );
  }

  try {
    const repo = await fetchRepo(parsed.owner, parsed.name);
    const [release, readme, iconUrl] = await Promise.all([
      fetchLatestRelease(repo.owner, repo.name),
      fetchReadme(repo.owner, repo.name),
      findRepoIcon(repo.owner, repo.name),
    ]);

    return NextResponse.json({
      repo,
      release,
      suggestion: {
        slug: slugify(repo.name),
        name: repo.name,
        tagline: repo.description,
        description: absolutiseReadme(readme, repo.owner, repo.name),
        category: guessCategory(repo.topics, repo.description),
        iconUrl,
        homepage: repo.homepage,
        tags: repo.topics.slice(0, 6),
        verified: await canPublish(user.githubLogin, repo.owner, repo.name),
      },
    });
  } catch (error) {
    if (error instanceof GitHubError) {
      const message =
        error.status === 404
          ? "No public repository at that address."
          : error.message;
      return NextResponse.json({ error: message }, { status: error.status });
    }

    console.error("[appshop] repo lookup failed:", error);
    return NextResponse.json({ error: "Could not reach GitHub. Try again." }, { status: 502 });
  }
}
