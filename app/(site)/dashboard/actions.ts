"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createApp,
  deleteApp,
  getAppById,
  slugTaken,
  updateApp,
  type AppInput,
} from "@/lib/apps";
import { isAppwriteConfigured } from "@/lib/appwrite/config";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { slugify } from "@/lib/format";
import { canPublish, fetchLatestRelease, fetchRepo, parseRepo } from "@/lib/github";
import type { AppStatus } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | undefined;

const LIMITS = {
  name: 128,
  tagline: 200,
  description: 20000,
  homepage: 512,
  requirements: 200,
  iconUrl: 1024,
};

function text(form: FormData, key: string, limit: number): string {
  return String(form.get(key) ?? "").trim().slice(0, limit);
}

/** One URL per line in the textarea; anything that isn't http(s) is dropped. */
function urlList(form: FormData, key: string, max = 6): string[] {
  return String(form.get(key) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line))
    .slice(0, max);
}

function tagList(form: FormData): string[] {
  return String(form.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * Shared by publish and edit. Everything the publisher typed is validated here;
 * the repo facts are re-fetched from GitHub rather than trusted from the form,
 * so a hand-crafted POST cannot list a repo that doesn't exist.
 */
async function readForm(form: FormData): Promise<
  { error: string } | { input: Omit<AppInput, "ownerId" | "ownerName" | "ownerAvatar"> }
> {
  const parsed = parseRepo(text(form, "repo", 300));
  if (!parsed) return { error: "Enter the GitHub repository as github.com/owner/repo." };

  const name = text(form, "name", LIMITS.name);
  if (!name) return { error: "Give the app a name." };

  const tagline = text(form, "tagline", LIMITS.tagline);
  if (!tagline) return { error: "Write a one-line description. It's what the cards show." };

  const category = String(form.get("category") ?? "");
  if (!CATEGORY_SLUGS.includes(category)) return { error: "Pick a category." };

  const slug = slugify(text(form, "slug", 64) || name);
  if (!slug) return { error: "That name doesn't produce a usable web address. Set a slug." };

  let repo;
  try {
    repo = await fetchRepo(parsed.owner, parsed.name);
  } catch {
    return { error: "That repository isn't public, or GitHub couldn't be reached." };
  }

  const release = await fetchLatestRelease(repo.owner, repo.name).catch(() => null);

  const status = String(form.get("status") ?? "published");
  const validStatus: AppStatus =
    status === "draft" || status === "unlisted" ? status : "published";

  return {
    input: {
      slug,
      name,
      tagline,
      description: text(form, "description", LIMITS.description),
      category,
      platform: "macos",
      repoOwner: repo.owner,
      repoName: repo.name,
      homepage: text(form, "homepage", LIMITS.homepage),
      iconUrl: text(form, "iconUrl", LIMITS.iconUrl),
      screenshots: urlList(form, "screenshots"),
      ownerGithub: repo.ownerLogin,
      status: validStatus,
      featured: false,
      verified: false,
      downloads: 0,
      stars: repo.stars,
      latestVersion: release?.tag ?? "",
      releasedAt: release?.publishedAt ?? "",
      requirements: text(form, "requirements", LIMITS.requirements),
      tags: tagList(form),
    },
  };
}

export async function publishApp(_state: FormState, form: FormData): Promise<FormState> {
  if (!isAppwriteConfigured()) {
    return { error: "Publishing needs an Appwrite project. See the setup notice on the home page." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in and try again." };

  const result = await readForm(form);
  if ("error" in result) return { error: result.error };

  if (await slugTaken(result.input.slug)) {
    return { error: `The address /apps/${result.input.slug} is taken. Pick another slug.` };
  }

  let slug: string;
  try {
    const app = await createApp({
      ...result.input,
      ownerId: user.id,
      ownerName: user.name,
      ownerAvatar: user.avatarUrl,
      // Verification is decided server-side from the signed-in GitHub identity,
      // never from the form.
      verified: await canPublish(
        user.githubLogin,
        result.input.repoOwner,
        result.input.repoName,
      ),
    });
    slug = app.slug;
  } catch (error) {
    console.error("[appshop] publish failed:", error);
    return { error: error instanceof Error ? error.message : "Could not publish. Try again." };
  }

  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath("/dashboard");
  redirect(`/apps/${slug}`);
}

export async function saveApp(_state: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Sign in and try again." };

  const id = String(form.get("id") ?? "");
  const existing = await getAppById(id);
  if (!existing) return { error: "That listing no longer exists." };
  if (existing.ownerId !== user.id) return { error: "That listing belongs to someone else." };

  const result = await readForm(form);
  if ("error" in result) return { error: result.error };

  if (await slugTaken(result.input.slug, id)) {
    return { error: `The address /apps/${result.input.slug} is taken. Pick another slug.` };
  }

  try {
    await updateApp(id, {
      ...result.input,
      // Preserved rather than reset: these are not the form's to change.
      downloads: existing.downloads,
      featured: existing.featured,
      ownerId: existing.ownerId,
      ownerName: user.name,
      ownerAvatar: user.avatarUrl || existing.ownerAvatar,
      verified: await canPublish(
        user.githubLogin,
        result.input.repoOwner,
        result.input.repoName,
      ),
    });
  } catch (error) {
    console.error("[appshop] save failed:", error);
    return { error: error instanceof Error ? error.message : "Could not save. Try again." };
  }

  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath(`/apps/${result.input.slug}`);
  revalidatePath("/dashboard");

  return { ok: "Saved." };
}

export async function removeApp(form: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const id = String(form.get("id") ?? "");
  const existing = await getAppById(id);
  if (!existing || existing.ownerId !== user.id) redirect("/dashboard");

  await deleteApp(id);

  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
