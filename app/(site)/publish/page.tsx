import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppleIcon, CheckIcon, GitHubIcon } from "@/components/icons";
import { ButtonLink, Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Connect Repo & Publishing Guide · Developer Studio",
  description: "How distribution on Appshop works: metadata here, signed binaries in your GitHub releases.",
};

const REQUIREMENTS = [
  "A public GitHub repository with tagged releases.",
  "At least one binary asset (.dmg, .pkg or .zip) attached to the latest release.",
  "An app icon in the repository root (e.g. docs/icon.png or AppIcon.appiconset), or provided in the form.",
  "A brief description and category.",
];

const FAQ = [
  {
    q: "Do you store our binaries?",
    a: "No. Appshop holds only metadata (name, description, tags, icon URL). The download link resolves directly against GitHub's release CDN at request time.",
  },
  {
    q: "What does the verified badge mean?",
    a: "That the signed-in GitHub account owns the repository or has push access to it. Appshop verifies OAuth identity at publish time — the form cannot set it.",
  },
  {
    q: "Can I list an app someone else wrote?",
    a: "It will publish, but without the verified badge. Listings for repos you do not control are fair game for the owner to claim.",
  },
  {
    q: "Is there a review queue?",
    a: "No. Publishing is immediate. Use unlisted visibility if you want a link you can share before the app goes on the shelves.",
  },
];

export default async function PublishPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="w-full pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-140px)]">
      <div className="w-full bg-surface-container-lowest/90 rounded-[2rem] p-6 sm:p-10 lg:p-12 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col gap-10 border border-black/5">
        
        {/* Header Hero Area */}
        <div className="border-b border-line/60 pb-8">
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            Developer Fleet Integration
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight mt-1.5">
            Connect Your Repository
          </h1>
          <p className="mt-3 text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Appshop connects to your GitHub releases directly. There is no manual binary upload step:
            point your repository once, and every release tag turns into an instant verified download.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink
              href="/dashboard/new"
              size="lg"
              className="rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs px-6 py-3 shadow-[0_4px_16px_rgba(0,74,198,0.25)] flex items-center gap-2"
            >
              <GitHubIcon className="h-4 w-4" />
              Connect Repository
            </ButtonLink>
            <ButtonLink
              href="/sign-up"
              variant="outline"
              size="lg"
              className="rounded-full text-xs font-bold"
            >
              Create Developer Account
            </ButtonLink>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10 min-w-0">
            {/* Checklist */}
            <section className="bg-surface-container-low/40 rounded-2xl p-6 sm:p-8 border border-line/60">
              <h2 className="text-lg font-bold text-on-surface mb-4">What you need to connect</h2>
              <ul className="space-y-3">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-on-surface-variant leading-6">
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-good" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Naming release assets */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface">Naming your release assets</h2>
              <p className="text-sm leading-7 text-on-surface-variant">
                The download router resolves architecture and format automatically from asset filenames:
                names containing <Code>arm64</Code>, <Code>aarch64</Code> or <Code>apple-silicon</Code> are served to Apple silicon;
                <Code>x86_64</Code> or <Code>intel</Code> serves Intel Macs; and <Code>universal</Code> or unmarked releases run everywhere.
              </p>

              <Card className="p-6 rounded-2xl border border-line bg-surface-container-lowest shadow-sm">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold text-on-surface">
                  <AppleIcon className="h-4 w-4 text-primary" />
                  Recommended Asset Naming Scheme
                </p>
                <ul className="space-y-1.5 font-mono text-xs text-on-surface-variant bg-surface-container p-3 rounded-xl">
                  <li>Crest-1.1.0-universal.dmg (Recommended)</li>
                  <li>Workstation-0.1.0-macOS-arm64.zip</li>
                  <li>Workstation-0.1.0-macOS-x86_64.zip</li>
                </ul>
              </Card>
            </section>

            {/* Artwork, Banners & Screenshots */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface">Artwork, Banners &amp; Screenshots</h2>
              <p className="text-sm leading-7 text-on-surface-variant">
                No storage bucket or image upload required. Appshop automatically discovers your app icon, card banner, and screenshot gallery straight from your repository&rsquo;s git tree via GitHub&rsquo;s raw CDN.
              </p>

              <Card className="p-6 rounded-2xl border border-line bg-surface-container-lowest shadow-sm">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
                  Recommended Repository Structure
                </p>
                <div className="font-mono text-xs text-on-surface-variant bg-surface-container p-4 rounded-xl leading-6 overflow-x-auto">
                  <div className="text-primary font-bold">your-repo/</div>
                  <div className="pl-4">├── <span className="text-on-surface font-semibold">art/banner.png</span> <span className="text-muted"># Store card header &amp; hero showcase (1200×630 or 16:9)</span></div>
                  <div className="pl-4">├── <span className="text-on-surface font-semibold">screenshots/</span> <span className="text-muted"># Gallery screenshots (ordered 01-, 02-...)</span></div>
                  <div className="pl-8">├── 01-overview.png</div>
                  <div className="pl-8">└── 02-preferences.png</div>
                  <div className="pl-4">└── <span className="text-on-surface font-semibold">AppIcon.appiconset/</span> <span className="text-muted"># Or docs/icon.png (512×512 PNG)</span></div>
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  Also supports <Code>assets/banner.png</Code>, <Code>media/banner.png</Code>, <Code>cover.png</Code>, or <Code>hero.png</Code>.
                </p>
              </Card>
            </section>

            {/* FAQ */}
            <section className="space-y-4 pt-4 border-t border-line/60">
              <h2 className="text-xl font-bold text-on-surface mb-4">Frequently Asked Questions</h2>
              <dl className="divide-y divide-line/60">
                {FAQ.map((item) => (
                  <div key={item.q} className="py-5">
                    <dt className="text-sm font-bold text-on-surface">{item.q}</dt>
                    <dd className="mt-1.5 text-xs sm:text-sm leading-6 text-on-surface-variant">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="p-6 rounded-2xl border border-line bg-surface-container-lowest shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">terminal</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface">Automated Distribution</h3>
              <p className="text-xs text-on-surface-variant leading-5">
                Every release tag in your repo generates an instant direct link, verified checksum display, and Homebrew cask compatibility.
              </p>
              <ButtonLink href="/dashboard/new" className="w-full rounded-full text-xs font-bold justify-center">
                Get Started
              </ButtonLink>
            </Card>
          </aside>
        </div>

      </div>
    </main>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-surface-container px-1.5 py-0.5 font-mono text-xs text-primary font-bold">
      {children}
    </code>
  );
}
