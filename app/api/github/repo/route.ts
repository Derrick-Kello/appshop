import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { guessCategory } from "@/lib/categories";
import { slugify } from "@/lib/format";
import {
  GitHubError,
  absolutiseReadme,
  canPublish,
  cleanGitHubToken,
  fetchLatestRelease,
  fetchReadme,
  fetchRepo,
  findRepoMedia,
  parseRepo,
} from "@/lib/github";

export const dynamic = "force-dynamic";

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
  const rawToken = request.nextUrl.searchParams.get("token")?.trim();
  const token = cleanGitHubToken(rawToken) || undefined;
  const parsed = parseRepo(input);
  if (!parsed) {
    return NextResponse.json(
      { error: "That doesn't look like a GitHub repository. Try github.com/owner/repo." },
      { status: 400 },
    );
  }

  try {
    const repo = await fetchRepo(parsed.owner, parsed.name, token);
    const [release, readme, media] = await Promise.all([
      fetchLatestRelease(repo.owner, repo.name, token),
      fetchReadme(repo.owner, repo.name, token),
      findRepoMedia(repo.owner, repo.name, token),
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
        iconUrl: media.iconUrl,
        screenshots: media.screenshots,
        homepage: repo.homepage,
        tags: repo.topics.slice(0, 6),
        verified: await canPublish(user.githubLogin, repo.owner, repo.name, token),
      },
    });
  } catch (error) {
    if (error instanceof GitHubError) {
      let message = error.message;
      if (error.status === 404) {
        message = token
          ? `Repository "${parsed.owner}/${parsed.name}" not found. Please verify the owner/repo name and ensure your Personal Access Token has the "repo" scope.`
          : `No public repository at "${parsed.owner}/${parsed.name}". If this is a private repository, please check "This is a private repository" and enter your GitHub Personal Access Token.`;
      } else if (error.status === 401) {
        message = "GitHub authentication failed: Your Personal Access Token appears to be invalid or expired.";
      } else if (error.status === 403) {
        message = token
          ? "GitHub access forbidden: Your token may lack the required permissions (needs 'repo' scope) or organization SSO authorization."
          : error.message;
      }
      return NextResponse.json({ error: message }, { status: error.status });
    }

    console.error("[appshop] repo lookup failed:", error);
    return NextResponse.json({ error: "Could not reach GitHub. Try again." }, { status: 502 });
  }
}

