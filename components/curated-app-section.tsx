"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { AppCard } from "@/components/app-card";
import { ArrowIcon } from "@/components/icons";
import type { App } from "@/lib/types";

type CategoryFilter = "all" | "system" | "developer" | "productivity" | "media" | "creative";
type PlatformFilter = "all" | "macos" | "pwa" | "mobile";

const PLATFORM_PILLS: { id: PlatformFilter; label: string }[] = [
  { id: "all", label: "All Platforms" },
  { id: "macos", label: "macOS Native" },
  { id: "pwa", label: "PWA & Web" },
  { id: "mobile", label: "Mobile / Stores" },
];

const CATEGORY_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "system", label: "System & Utilities" },
  { id: "developer", label: "Developer Tools" },
  { id: "productivity", label: "Productivity" },
  { id: "media", label: "Audio & Media" },
  { id: "creative", label: "Design & Creative" },
];

export function CuratedAppSection({ apps }: { apps: App[] }) {
  const [activePlatform, setActivePlatform] = useState<PlatformFilter>("all");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Platform filter
      if (activePlatform !== "all") {
        if (activePlatform === "pwa" && !(app.platform === "pwa" || app.pwaUrl)) return false;
        if (activePlatform === "macos" && !(app.platform === "macos" || (!app.platform && !app.pwaUrl))) return false;
        if (activePlatform === "mobile" && !(app.appStoreUrl || app.playStoreUrl || app.platform === "ios" || app.platform === "android")) return false;
      }
      // Category filter
      if (activeCategory === "all") return true;
      if (activeCategory === "system") {
        return app.category === "system" || app.tags?.includes("system") || app.tags?.includes("menu bar");
      }
      if (activeCategory === "developer") {
        return app.category === "developer" || app.tags?.includes("developer") || app.tags?.includes("terminal");
      }
      if (activeCategory === "productivity") {
        return app.category === "productivity" || app.tags?.includes("productivity");
      }
      if (activeCategory === "media") {
        return app.category === "media" || app.tags?.includes("audio") || app.tags?.includes("music");
      }
      if (activeCategory === "creative") {
        return app.category === "creative" || app.tags?.includes("design");
      }
      return app.category === activeCategory;
    });
  }, [apps, activePlatform, activeCategory]);

  return (
    <section className="flex flex-col gap-6">
      {/* Section Header with Segmented Filter Pills */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Curated Directory
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              Top Verified Apps &amp; Utilities
            </h3>
          </div>

          {/* Platform Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            {PLATFORM_PILLS.map((pill) => {
              const isActive = activePlatform === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActivePlatform(pill.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary-container text-white shadow-sm"
                      : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Horizontal Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar pt-1 border-t border-line/40">
          <span className="text-xs font-semibold text-muted mr-1 shrink-0">Category:</span>
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activeCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-on-surface text-surface shadow-sm font-semibold"
                    : "bg-surface-container/60 text-muted hover:text-ink hover:bg-surface-container"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Column Card Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface-container-low/40 p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[26px]">terminal</span>
          </div>
          <h4 className="text-base font-bold text-on-surface">No apps published yet</h4>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
            The curated directory is waiting for its first listing. Link your public GitHub repository with a tagged release or web app to publish here.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-[0_4px_16px_rgba(0,74,198,0.25)] flex items-center gap-1.5"
          >
            <span>Connect Repository</span>
            <ArrowIcon className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface-container-low/50 p-12 text-center">
          <p className="text-sm font-semibold text-on-surface">No apps match the selected filters.</p>
          <button
            type="button"
            onClick={() => {
              setActivePlatform("all");
              setActiveCategory("all");
            }}
            className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
        >
          <span>Explore all apps in directory</span>
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
