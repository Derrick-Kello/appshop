import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { CuratedAppSection } from "@/components/curated-app-section";
import { listApps } from "@/lib/apps";
import { isAppwriteConfigured } from "@/lib/appwrite/config";
import { getCurrentUser } from "@/lib/auth";
import type { App } from "@/lib/types";

export const revalidate = 300;

export default async function HomePage() {
  const [featured, recent, popular, all, user] = await Promise.all([
    listApps({ featured: true, limit: 6 }),
    listApps({ sort: "recent", limit: 8 }),
    listApps({ sort: "popular", limit: 8 }),
    listApps({ limit: 40 }),
    getCurrentUser(),
  ]);

  const heroApp = featured[0] ?? recent[0] ?? null;
  const secondaryApp = (featured[1] ?? recent[1] ?? popular[0]) ?? null;

  // Merge distinct apps for the curated directory
  const distinctApps = Array.from(
    new Map([...featured, ...recent, ...popular, ...all].map((app) => [app.id, app])).values(),
  );

  return (
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      {!isAppwriteConfigured() && <SetupNotice />}

      <div className="flex flex-col w-full">
        {/* Luminous Main Glass Canvas (matches Stitch reference style with 32px rounded shell and soft atmospheric shadow) */}
        <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-4 sm:p-7 lg:p-9 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-10 border border-black/5">
          
          {/* Hero Spotlight Grid: 2 Asymmetric Showcase Cards or Developer Spotlight */}
          {heroApp || secondaryApp ? (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {heroApp && <HeroCardPrimary app={heroApp} />}
              {secondaryApp && <HeroCardSecondary app={secondaryApp} />}
            </section>
          ) : (
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-8 sm:p-12 text-white shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 min-h-[340px]">
              <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.4)_0%,transparent_60%),radial-gradient(circle_at_80%_70%,rgba(107,56,212,0.4)_0%,transparent_60%)] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col max-w-xl">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md border border-blue-400/20 mb-4 w-fit">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Independent Mac Ecosystem
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Publish Your App in Minutes
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Join developers publishing native macOS utilities, Progressive Web Apps, and cross-platform releases directly through GitHub.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={user ? "/dashboard/new" : "/publish"}
                    className="px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(0,74,198,0.3)] flex items-center gap-2"
                  >
                    <span>{user ? "Publish an App" : "Connect GitHub Repository"}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  {!user && (
                    <Link
                      href="/sign-in"
                      className="px-6 py-3 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all backdrop-blur-md border border-white/15"
                    >
                      Developer Sign In
                    </Link>
                  )}
                </div>
              </div>

              <div className="relative z-10 shrink-0 hidden md:flex items-center justify-center">
                <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-blue-500/20 to-purple-500/30 border border-white/20 shadow-2xl backdrop-blur-2xl flex items-center justify-center text-white/90">
                  <span className="material-symbols-outlined text-[64px] text-blue-300">hub</span>
                </div>
              </div>
            </section>
          )}

          {/* Curated Category & Grid Matrix */}
          <CuratedAppSection apps={distinctApps} />

          {/* Developer Connect Banner Card */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high p-6 sm:p-8 lg:p-9 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-line/60">
            {/* Ambient Glow Decorators */}
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary-fixed-dim/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest shadow-md flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[28px]">hub</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-lg sm:text-xl font-bold text-on-surface">Are you an indie desktop developer?</h4>
                <p className="text-sm text-on-surface-variant max-w-2xl mt-1 leading-6">
                  Connect your GitHub repo in 60 seconds — automated Apple Notarization, Windows Authenticode signing, and instant Homebrew &amp; Winget delivery.
                </p>
              </div>
            </div>

            <div className="relative z-10 shrink-0 w-full md:w-auto flex items-center justify-end">
              <Link
                href={user ? "/dashboard" : "/publish"}
                className="w-full md:w-auto px-6 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container font-bold text-xs transition-all shadow-[0_4px_16px_rgba(0,74,198,0.25)] active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {user ? "dashboard" : "terminal"}
                </span>
                <span>{user ? "Open Developer Studio" : "Connect Repository"}</span>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}

function HeroCardPrimary({ app }: { app: App }) {
  const screenshot = app.screenshots?.[0] ?? null;

  return (
    <article className="lg:col-span-7 group relative flex flex-col justify-between overflow-hidden rounded-2xl min-h-[440px] shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950">
      {/* Visual Backdrop */}
      {screenshot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshot}
          alt={app.name}
          className="absolute inset-0 z-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, rgba(37,99,235,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(107,56,212,0.4) 0%, transparent 60%)"
          }}
        />
      )}

      {/* Gradient Scrim for text contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

      {/* Top Status Bar & Metadata Pills */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between gap-3 flex-wrap">
        {/* User Pill with Avatar Stack */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse" />
          <span>Featured Native Utility</span>
        </div>

        {/* Rating & Platform Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-amber-300">star</span>
            <span>4.9</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-sm">
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            <span>{app.platform === "macos" ? "Universal DMG" : "Cross-Platform"}</span>
          </div>
        </div>
      </div>

      {/* Middle Headline */}
      <div className="relative z-10 px-5 sm:px-6 pt-12 pb-4 mt-auto">
        <span className="inline-block uppercase tracking-wider text-primary-fixed text-xs font-bold mb-1.5">
          Spotlight Release
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl text-white font-extrabold tracking-tight drop-shadow-sm max-w-xl">
          {app.name} — {app.tagline || "Your whole Mac, one click away."}
        </h2>
      </div>

      {/* Frosted Glass Bottom Action Shelf */}
      <div className="relative z-10 p-4 sm:p-5 bg-white/25 backdrop-blur-2xl border-t border-white/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/90 p-1 shadow-md shrink-0 flex items-center justify-center">
            <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="md" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-white truncate">{app.name}</span>
              <span className="bg-primary-container/80 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                {app.latestVersion || "v1.0"}
              </span>
            </div>
            <p className="text-xs text-white/85 truncate mt-0.5">
              {app.ownerName || app.repoOwner} · Verified Signed Binary
            </p>
          </div>
        </div>

        {/* Get Action Pill */}
        <Link
          href={`/apps/${app.slug}`}
          className="shrink-0 px-5 py-2 rounded-full bg-white text-on-surface hover:bg-primary hover:text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 flex items-center gap-1.5"
        >
          <span>Get</span>
          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
        </Link>
      </div>
    </article>
  );
}

function HeroCardSecondary({ app }: { app: App }) {
  const screenshot = app.screenshots?.[0] ?? null;

  return (
    <article className="lg:col-span-5 group relative flex flex-col justify-between overflow-hidden rounded-2xl min-h-[440px] shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-violet-950 via-purple-950 to-slate-900">
      {/* Visual Backdrop */}
      {screenshot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshot}
          alt={app.name}
          className="absolute inset-0 z-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-80"
          style={{
            backgroundImage: "radial-gradient(circle at 70% 30%, rgba(139,92,246,0.4) 0%, transparent 60%), radial-gradient(circle at 30% 80%, rgba(6,182,212,0.4) 0%, transparent 60%)"
          }}
        />
      )}

      {/* Gradient Scrim */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

      {/* Top Status Bar & Metadata Pills */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
          <span>Trending on macOS</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-amber-300">star</span>
            <span>5.0</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-sm">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Notarized</span>
          </div>
        </div>
      </div>

      {/* Middle Headline */}
      <div className="relative z-10 px-5 sm:px-6 pt-12 pb-4 mt-auto">
        <span className="inline-block uppercase tracking-wider text-secondary-fixed text-xs font-bold mb-1.5">
          Powerhouse Tool
        </span>
        <h2 className="text-2xl sm:text-3xl text-white font-extrabold tracking-tight drop-shadow-sm">
          {app.name}
        </h2>
        <p className="text-xs text-white/80 line-clamp-2 mt-1">
          {app.tagline || app.description}
        </p>
      </div>

      {/* Frosted Glass Bottom Shelf */}
      <div className="relative z-10 p-4 sm:p-5 bg-white/25 backdrop-blur-2xl border-t border-white/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/90 p-1 shadow-md shrink-0 flex items-center justify-center">
            <AppIcon name={app.name} slug={app.slug} src={app.iconUrl} size="md" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-white truncate">{app.name}</span>
            <p className="text-xs text-white/85 truncate">
              {app.ownerName || app.repoOwner}
            </p>
          </div>
        </div>

        {/* Get Action Pill */}
        <Link
          href={`/apps/${app.slug}`}
          className="shrink-0 px-5 py-2 rounded-full bg-white text-on-surface hover:bg-secondary hover:text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 flex items-center gap-1.5"
        >
          <span>Get</span>
          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
        </Link>
      </div>
    </article>
  );
}

function SetupNotice() {
  return (
    <div className="mb-6 rounded-2xl bg-warn-soft/80 backdrop-blur-md border border-warn-line/50 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-warn text-[22px]">info</span>
        <p className="text-xs text-clay leading-5">
          <strong className="text-warn font-bold">Bundled Catalogue Active:</strong> Running on seed listings until Appwrite credentials are configured in <code className="font-mono bg-warn-line/40 px-1 py-0.5 rounded">.env.local</code>.
        </p>
      </div>
    </div>
  );
}
