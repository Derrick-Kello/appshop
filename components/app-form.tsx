"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { CATEGORIES } from "@/lib/categories";
import { archLabel, formatBytes, slugify } from "@/lib/format";
import type { App, Release, Repo } from "@/lib/types";

import { AppIcon } from "./app-icon";
import { CheckIcon, GitHubIcon, SpinnerIcon, StarIcon, WarnIcon } from "./icons";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Notice,
  Select,
  Textarea,
  cx,
} from "./ui";

type FormState = { error?: string; ok?: string } | undefined;
type Action = (state: FormState, form: FormData) => Promise<FormState>;

type Imported = {
  repo: Repo;
  release: Release | null;
  suggestion: {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    category: string;
    homepage: string;
    tags: string[];
    verified: boolean;
  };
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <SpinnerIcon />}
      {pending ? "Saving" : label}
    </Button>
  );
}

/**
 * The import step. Everything GitHub can answer for itself is answered here, so
 * the publisher is left filling in only the things a repository doesn't know:
 * the category, the one-liner, and the screenshots.
 */
function RepoImporter({
  onImport,
  disabled,
}: {
  onImport: (data: Imported) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const repo = value.trim();
    if (!repo) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/github/repo?repo=${encodeURIComponent(repo)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "GitHub lookup failed.");
      onImport(body as Imported);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "GitHub lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <Field
        label="GitHub repository"
        hint="Public repos only. Paste the URL or type owner/repo."
        error={error || undefined}
      >
        <div className="flex gap-2">
          <Input
            value={value}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void load();
              }
            }}
            placeholder="github.com/owner/repo"
            className="font-mono text-[13px]"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load()}
            disabled={loading || disabled || !value.trim()}
            className="shrink-0"
          >
            {loading ? <SpinnerIcon /> : <GitHubIcon />}
            {loading ? "Reading" : "Fetch"}
          </Button>
        </div>
      </Field>
    </Card>
  );
}

/** What Appshop found, shown before the publisher commits to it. */
function RepoSummary({ data }: { data: Imported }) {
  const { repo, release, suggestion } = data;
  const build = release?.builds[0];

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={repo.ownerAvatar}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg border border-hairline"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] text-ink">{repo.fullName}</span>
            {suggestion.verified ? (
              <Badge accent="green">
                <CheckIcon className="h-3 w-3" />
                You can publish this
              </Badge>
            ) : (
              <Badge accent="yellow">Unverified</Badge>
            )}
          </div>

          {repo.description && (
            <p className="mt-1.5 text-[13px] leading-6 text-mute">{repo.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-stone">
            <span className="flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5" />
              {repo.stars}
            </span>
            {repo.license && <span>{repo.license}</span>}
            {repo.archived && <span className="text-accent-yellow">Archived</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-hairline pt-4 text-[13px]">
        {release ? (
          build ? (
            <p className="flex flex-wrap items-center gap-2 text-mute">
              <CheckIcon className="h-4 w-4 text-accent-green" />
              Latest release{" "}
              <span className="font-mono text-charcoal">{release.tag}</span> ships{" "}
              <span className="text-charcoal">{build.name}</span> ·{" "}
              {archLabel(build.arch)} · {formatBytes(build.size)}
            </p>
          ) : (
            <p className="flex items-start gap-2 text-mute">
              <WarnIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-yellow" />
              Release {release.tag} has no .dmg, .pkg or .zip attached, so there is
              nothing for the download button to resolve to yet.
            </p>
          )
        ) : (
          <p className="flex items-start gap-2 text-mute">
            <WarnIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-yellow" />
            No published release. You can still list the app — the download appears
            the moment you tag one.
          </p>
        )}
      </div>

      {!suggestion.verified && (
        <p className="mt-3 text-[12px] leading-5 text-ash">
          Appshop marks a listing verified when the signed-in GitHub account owns
          the repository or has push access to it. Sign in with GitHub to claim it.
        </p>
      )}
    </Card>
  );
}

export function AppForm({
  mode,
  action,
  app,
}: {
  mode: "create" | "edit";
  action: Action;
  app?: App;
}) {
  const [state, submit] = useActionState<FormState, FormData>(action, undefined);
  const [imported, setImported] = useState<Imported | null>(null);

  // Controlled only for the fields the importer overwrites; everything else is
  // left uncontrolled so typing stays cheap.
  const [repo, setRepo] = useState(
    app ? `${app.repoOwner}/${app.repoName}` : "",
  );
  const [name, setName] = useState(app?.name ?? "");
  const [slug, setSlug] = useState(app?.slug ?? "");
  const [tagline, setTagline] = useState(app?.tagline ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [category, setCategory] = useState(app?.category ?? "utilities");
  const [homepage, setHomepage] = useState(app?.homepage ?? "");
  const [tags, setTags] = useState(app?.tags.join(", ") ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(app));

  function applyImport(data: Imported) {
    setImported(data);
    setRepo(data.repo.fullName);
    setName(data.suggestion.name);
    setSlug(data.suggestion.slug);
    setTagline(data.suggestion.tagline);
    setDescription(data.suggestion.description);
    setCategory(data.suggestion.category);
    setHomepage(data.suggestion.homepage);
    setTags(data.suggestion.tags.join(", "));
  }

  const ready = mode === "edit" || Boolean(imported);

  return (
    <div className="space-y-6">
      {mode === "create" && (
        <>
          <RepoImporter onImport={applyImport} />
          {imported && <RepoSummary data={imported} />}
        </>
      )}

      <form action={submit} className={cx("space-y-6", !ready && "pointer-events-none opacity-40")}>
        {app && <input type="hidden" name="id" value={app.id} />}
        <input type="hidden" name="repo" value={repo} />

        <Card className="space-y-5 p-5">
          <div className="flex items-start gap-4">
            <AppIcon name={name || "A"} slug={slug || "app"} size="md" />
            <p className="text-[12px] leading-5 text-ash">
              Without an icon URL, Appshop generates a stable mark from the app&rsquo;s
              address. Point the icon field at a PNG in your repo to replace it.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <Input
                name="name"
                required
                maxLength={128}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited) setSlug(slugify(event.target.value));
                }}
              />
            </Field>

            <Field label="Address" hint={`/apps/${slug || "your-app"}`}>
              <Input
                name="slug"
                required
                maxLength={64}
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(slugify(event.target.value));
                }}
                className="font-mono text-[13px]"
              />
            </Field>
          </div>

          <Field
            label="One-liner"
            hint="Shown on every card and in search results. Keep it under a line."
          >
            <Input
              name="tagline"
              required
              maxLength={200}
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              placeholder="Your whole Mac, one click from the menu bar."
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category">
              <Select
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Visibility" hint="Unlisted apps work by link but stay off the shelves.">
              <Select name="status" defaultValue={app?.status ?? "published"}>
                <option value="published">Published</option>
                <option value="unlisted">Unlisted</option>
                <option value="draft">Draft</option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <Field
            label="Description"
            hint="Markdown. Imported from your README, so trim it down to what a store page needs."
          >
            <Textarea
              name="description"
              rows={14}
              maxLength={20000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="font-mono text-[12.5px] leading-6"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Website" optional>
              <Input
                name="homepage"
                type="url"
                maxLength={512}
                value={homepage}
                onChange={(event) => setHomepage(event.target.value)}
                placeholder="https://example.com"
              />
            </Field>

            <Field label="Requires" optional hint="Shown next to the download button.">
              <Input
                name="requirements"
                maxLength={200}
                defaultValue={app?.requirements ?? ""}
                placeholder="macOS 14 or later"
              />
            </Field>
          </div>

          <Field label="Icon URL" optional hint="A square PNG, 512px or larger.">
            <Input
              name="iconUrl"
              type="url"
              maxLength={1024}
              defaultValue={app?.iconUrl ?? ""}
              placeholder="https://raw.githubusercontent.com/owner/repo/HEAD/docs/icon.png"
            />
          </Field>

          <Field
            label="Screenshots"
            optional
            hint="One URL per line, up to six. The first one becomes the social preview."
          >
            <Textarea
              name="screenshots"
              rows={4}
              defaultValue={app?.screenshots.join("\n") ?? ""}
              className="font-mono text-[12.5px]"
              placeholder="https://raw.githubusercontent.com/owner/repo/HEAD/docs/shot-1.png"
            />
          </Field>

          <Field label="Tags" optional hint="Comma separated, up to eight.">
            <Input
              name="tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="menu bar, privacy, cleaner"
            />
          </Field>
        </Card>

        {state?.error && <Notice tone="error">{state.error}</Notice>}
        {state?.ok && <Notice tone="success">{state.ok}</Notice>}

        <div className="flex items-center gap-3">
          <SubmitButton label={mode === "create" ? "Publish app" : "Save changes"} />
          {mode === "create" && !ready && (
            <span className="text-[13px] text-ash">Fetch a repository to continue.</span>
          )}
        </div>
      </form>
    </div>
  );
}
