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
    iconUrl: string;
    screenshots?: string[];
    verified: boolean;
  };
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <SpinnerIcon />}
      {pending ? "Saving" : label}
      {pending ? "Publishing..." : label}
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
  onImport: (data: Imported, isPrivate: boolean, token: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const repo = value.trim();
    if (!repo) return;

    setLoading(true);
    setError("");

    const cleanTok = token
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^(Bearer|token)\s+/i, "")
      .trim();
    const isPriv = isPrivate || Boolean(cleanTok);

    try {
      const url = cleanTok
        ? `/api/github/repo?repo=${encodeURIComponent(repo)}&token=${encodeURIComponent(cleanTok)}`
        : `/api/github/repo?repo=${encodeURIComponent(repo)}`;
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) {
        if (!cleanTok) {
          setIsPrivate(true);
        }
        throw new Error(body.error ?? "GitHub lookup failed.");
      }
      onImport(body as Imported, isPriv, cleanTok);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "GitHub lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <Field
        label="GitHub repository"
        hint={isPrivate ? "Enter owner/repo for your private repository." : "Public repos or private repos with an access token."}
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
            className="font-mono text-[14px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            disabled={loading || disabled || !value.trim()}
            className="shrink-0"
          >
            {loading ? <SpinnerIcon /> : <GitHubIcon />}
            {loading ? "Connecting..." : "Connect & Fetch"}
          </Button>
        </div>
      </Field>

      <div className="pt-2 border-t border-line/60 flex flex-col gap-3">
        <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPrivate || Boolean(token.trim())}
            onChange={(e) => {
              setIsPrivate(e.target.checked);
              if (!e.target.checked) setToken("");
            }}
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
          />
          <span>This is a private / proprietary repository</span>
          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
            Zero Code Exposure
          </span>
        </label>

        {(isPrivate || Boolean(token.trim())) && (
          <div className="space-y-2 rounded-xl bg-surface-container-low/60 p-3.5 border border-line">
            <Field
              label="GitHub Personal Access Token"
              hint="Requires read permissions for Contents and Releases ('repo' scope). Securely kept server-side and never exposed to visitors."
            >
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (e.target.value.trim()) setIsPrivate(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void load();
                    }
                  }}
                  placeholder="ghp_... or github_pat_..."
                  className="font-mono text-[13px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void load()}
                  disabled={loading || disabled || !value.trim()}
                  className="shrink-0 text-xs font-bold"
                >
                  {loading ? <SpinnerIcon /> : "Fetch with Token"}
                </Button>
              </div>
            </Field>
          </div>
        )}
      </div>
    </Card>
  );
}


/** What Appshop found, shown before the publisher commits to it. */
function RepoSummary({ data }: { data: Imported }) {
  const { repo, release, suggestion } = data;
  const build = release?.builds[0];

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={repo.ownerAvatar}
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl border border-line"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-semibold text-ink">{repo.fullName}</span>
            {suggestion.verified ? (
              <Badge accent="good">
                <CheckIcon className="h-3.5 w-3.5" />
                You can publish this
              </Badge>
            ) : (
              <Badge accent="warn">Unverified</Badge>
            )}
          </div>

          {repo.description && (
            <p className="mt-2 text-[15px] leading-7 text-muted">{repo.description}</p>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted">
            <span className="flex items-center gap-1">
              <StarIcon className="h-4 w-4" />
              {repo.stars}
            </span>
            {repo.license && <span>{repo.license}</span>}
            {repo.archived && <span className="text-warn">Archived</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5 text-[15px] leading-7">
        {release ? (
          build ? (
            <p className="flex flex-wrap items-center gap-2 text-muted">
              <CheckIcon className="h-4.5 w-4.5 text-good" />
              Latest release{" "}
              <span className="font-medium text-ink">{release.tag}</span> ships{" "}
              <span className="font-medium text-ink">{build.name}</span> ·{" "}
              {archLabel(build.arch)} · {formatBytes(build.size)}
            </p>
          ) : (
            <p className="flex items-start gap-2.5 text-muted">
              <WarnIcon className="mt-1 h-4.5 w-4.5 shrink-0 text-warn" />
              Latest release <span className="font-medium text-ink">{release.tag}</span> has no Mac binary attached.
            </p>
          )
        ) : (
          <p className="flex items-start gap-2.5 text-muted">
            <WarnIcon className="mt-1 h-4.5 w-4.5 shrink-0 text-warn" />
            No release found. You can still publish, but visitors won&rsquo;t be able to download until you tag a release with a Mac binary.
          </p>
        )}
      </div>
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
  const [iconUrl, setIconUrl] = useState(app?.iconUrl ?? "");
  const [screenshots, setScreenshots] = useState(
    app?.screenshots.join("\n") ?? "",
  );
  const [platform, setPlatform] = useState(app?.platform ?? "macos");
  const [pwaUrl, setPwaUrl] = useState(app?.pwaUrl ?? "");
  const [appStoreUrl, setAppStoreUrl] = useState(app?.appStoreUrl ?? "");
  const [playStoreUrl, setPlayStoreUrl] = useState(app?.playStoreUrl ?? "");
  const [isPrivate, setIsPrivate] = useState(app?.isPrivate ?? false);
  const [githubToken, setGithubToken] = useState(app?.githubToken ?? "");
  const [binaryUrl, setBinaryUrl] = useState(app?.binaryUrl ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(app));

  function applyImport(data: Imported, isPriv: boolean, tok: string) {
    setImported(data);
    setRepo(data.repo.fullName);
    setName(data.suggestion.name);
    setSlug(data.suggestion.slug);
    setTagline(data.suggestion.tagline);
    setDescription(data.suggestion.description);
    setCategory(data.suggestion.category);
    setHomepage(data.suggestion.homepage);
    setTags(data.suggestion.tags.join(", "));
    setIconUrl(data.suggestion.iconUrl);
    if (data.suggestion.screenshots && data.suggestion.screenshots.length > 0) {
      setScreenshots(data.suggestion.screenshots.join("\n"));
    }
    if (isPriv || Boolean(tok)) {
      setIsPrivate(true);
      if (tok) setGithubToken(tok);
    }

  }

  const ready = mode === "edit" || Boolean(imported);

  return (
    <div className="space-y-6">
      {mode === "create" && (
        <>
          <RepoImporter onImport={applyImport} />
          {imported && (
            <>
              <RepoSummary data={imported} />
              <div className="rounded-2xl border border-good/30 bg-good/10 p-4 text-xs sm:text-sm text-good font-semibold flex items-center gap-2.5 shadow-sm">
                <CheckIcon className="h-4 w-4 shrink-0 text-good" />
                <span>Repository connected! Review the details below and click &ldquo;Publish app to store&rdquo; to finalize.</span>
              </div>
            </>
          )}
        </>
      )}

      <form action={submit} className={cx("space-y-6", !ready && "pointer-events-none opacity-40")}>
        {app && <input type="hidden" name="id" value={app.id} />}
        <input type="hidden" name="repo" value={repo} />
        <input type="hidden" name="isPrivate" value={isPrivate ? "true" : "false"} />
        <input type="hidden" name="githubToken" value={githubToken} />

        <Card className="space-y-6 p-6">
          <div className="flex items-start gap-4">
            <AppIcon name={name || "A"} slug={slug || "app"} src={iconUrl} size="md" />
            <p className="text-[14px] leading-6 text-muted">
              Appshop looks for an app icon in your repository — an
              `AppIcon.appiconset` or a `docs/icon.png`. If it finds nothing, it
              generates a stable mark from the app&rsquo;s address instead.
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
                className="font-mono text-[14px]"
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

          <div className="grid gap-5 sm:grid-cols-3">
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

            <Field label="Primary Platform">
              <Select
                name="platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
              >
                <option value="macos">macOS Desktop</option>
                <option value="pwa">Progressive Web App (PWA)</option>
                <option value="cross-platform">Cross-Platform (Desktop + Web)</option>
                <option value="ios">iOS / iPadOS</option>
                <option value="android">Android</option>
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

        {/* Cross-Platform & App Stores Card */}
        <Card className="space-y-6 p-6">
          <div>
            <h3 className="text-[16px] font-bold text-on-surface">Distribution Channels &amp; App Stores</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Distribute your app beyond GitHub desktop releases. Host a live PWA or link to official app stores.
            </p>
          </div>

          <Field
            label="Progressive Web App (PWA) URL"
            optional
            hint="URL where your web app or PWA is live (e.g. GitHub Pages or custom domain). Visitors can launch and install it directly."
          >
            <Input
              name="pwaUrl"
              type="url"
              maxLength={1024}
              value={pwaUrl}
              onChange={(event) => setPwaUrl(event.target.value)}
              placeholder="https://app.example.com"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Apple App Store URL"
              optional
              hint="Link to your iOS, iPadOS or Mac App Store product page."
            >
              <Input
                name="appStoreUrl"
                type="url"
                maxLength={1024}
                value={appStoreUrl}
                onChange={(event) => setAppStoreUrl(event.target.value)}
                placeholder="https://apps.apple.com/app/..."
              />
            </Field>

            <Field
              label="Google Play Store URL"
              optional
              hint="Link to your Android listing on Google Play."
            >
              <Input
                name="playStoreUrl"
                type="url"
                maxLength={1024}
                value={playStoreUrl}
                onChange={(event) => setPlayStoreUrl(event.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
              />
            </Field>
          </div>
        </Card>

        {/* Proprietary & Binary Distribution Card */}
        <Card className="space-y-5 p-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-on-surface">Proprietary Protection &amp; Binary Distribution</h3>
              {isPrivate && (
                <span className="text-[10px] font-bold bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded-full font-mono">
                  ZERO CODE EXPOSURE
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Distribute closed-source desktop software securely without exposing your source code, commits, or private repository to visitors.
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm font-semibold text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-primary focus:ring-primary"
            />
            <div className="flex flex-col">
              <span>Proprietary / Closed Source Software</span>
              <span className="text-xs font-normal text-muted">
                Appshop will hide all GitHub links, repository names, and source trees from the public store page.
              </span>
            </div>
          </label>

          {isPrivate && (
            <div className="space-y-4 rounded-xl bg-surface-container-low/50 p-4 border border-line">
              <Field
                label="GitHub Personal Access Token (for Private Releases)"
                optional
                hint="Stored securely server-side to sign and proxy release downloads on demand. Leave blank if not changing."
              >
                <Input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_... or github_pat_..."
                  className="font-mono text-[13px]"
                />
              </Field>

              <div className="rounded-lg bg-surface-container p-3 text-xs text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-good shrink-0">shield</span>
                <p className="leading-relaxed">
                  <strong>Zero Code Access Guarantee:</strong> When visitors click Download, Appshop signs a temporary download token via GitHub&rsquo;s Asset API and routes them straight to the compiled binary (.dmg / .zip). They never gain repository read access.
                </p>
              </div>
            </div>
          )}

          <Field
            label="Direct Binary Download URL (Optional)"
            optional
            hint="If you host compiled releases on AWS S3, Cloudflare R2, or a custom server, paste the direct URL here to serve it directly."
          >
            <Input
              name="binaryUrl"
              type="url"
              maxLength={1024}
              value={binaryUrl}
              onChange={(e) => setBinaryUrl(e.target.value)}
              placeholder="https://downloads.example.com/builds/app-v1.0.0.dmg"
              className="font-mono text-[13px]"
            />
          </Field>
        </Card>

        <Card className="space-y-6 p-6">
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
              className="font-mono text-[13.5px] leading-7"
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

          <Field
            label="Icon URL"
            optional
            hint="Found in your repo automatically. Override it with a square PNG, 512px or larger."
          >
            <Input
              name="iconUrl"
              type="url"
              maxLength={1024}
              value={iconUrl}
              onChange={(event) => setIconUrl(event.target.value)}
              placeholder="https://raw.githubusercontent.com/owner/repo/HEAD/docs/icon.png"
            />
          </Field>

          <Field
            label="Banner & Screenshots"
            optional
            hint="Auto-discovered from your repo (e.g. art/banner.png or screenshots/). The first URL is used for store cards & hero spotlight."
          >
            <Textarea
              name="screenshots"
              rows={4}
              value={screenshots}
              onChange={(event) => setScreenshots(event.target.value)}
              className="font-mono text-[13.5px]"
              placeholder="https://raw.githubusercontent.com/owner/repo/HEAD/art/banner.png"
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
          <SubmitButton label={mode === "create" ? "Publish app to store" : "Save changes"} />
          {mode === "create" && !ready && (
            <span className="text-[14px] text-muted">Connect a repository above to continue.</span>
          )}
        </div>
      </form>
    </div>
  );
}
