import type { Metadata } from "next";

import { AppleIcon, CheckIcon, GitHubIcon } from "@/components/icons";
import { ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Publishing on Appshop",
  description:
    "How to list a Mac app on Appshop: point at a public GitHub repo, attach a build to a release, and the download resolves itself.",
};

const REQUIREMENTS = [
  "A public GitHub repository.",
  "At least one release with a .dmg, .pkg or .zip attached.",
  "An Appshop account. Signing in with GitHub also verifies the listing.",
];

const FAQ = [
  {
    q: "Where do the binaries live?",
    a: "In your GitHub releases, where they already are. The download button hits a redirect route that looks up your latest release at the moment someone clicks it, then sends the browser to the asset. Appshop stores no files.",
  },
  {
    q: "Do I have to update the listing when I ship?",
    a: "No. Tag a release on GitHub and the store picks it up. The version, release notes and download all follow your latest tag on their own.",
  },
  {
    q: "How does the store pick which build to serve?",
    a: "It prefers a .dmg, then a .pkg, then a .zip, and reads the architecture out of the filename. Apple silicon wins an ambiguous request; every other build stays listed under the button.",
  },
  {
    q: "What does the verified badge mean?",
    a: "That the signed-in GitHub account owns the repository or has push access to it. Appshop checks against GitHub at publish time — the form cannot set it.",
  },
  {
    q: "Can I list an app someone else wrote?",
    a: "It will publish, but without the verified badge. Listings for repos you do not control are fair game for the owner to claim.",
  },
  {
    q: "Is there a review queue?",
    a: "No. Publishing is immediate. Use the unlisted visibility if you want a link you can share before the app goes on the shelves.",
  },
];

export default function PublishPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-medium tracking-tight text-ink">
          Publishing on Appshop
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-mute">
          Appshop is a storefront on top of GitHub releases. There is no upload
          step because there is nothing to upload: the listing is metadata, and
          the download resolves against your repository every time it&rsquo;s clicked.
        </p>
      </header>

      <Card className="mb-10 p-6">
        <h2 className="text-[13px] font-medium tracking-wide text-ash uppercase">
          What you need
        </h2>
        <ul className="mt-4 space-y-2.5">
          {REQUIREMENTS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[14px] leading-6 text-mute">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-accent-green" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard/new">
            <GitHubIcon />
            Publish an app
          </ButtonLink>
          <ButtonLink href="/sign-up" variant="secondary">
            Create an account
          </ButtonLink>
        </div>
      </Card>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-medium tracking-tight text-ink">
          Naming your release assets
        </h2>
        <p className="text-[14px] leading-7 text-mute">
          The store reads the architecture out of the filename, so a release that
          ships more than one build should say which is which. Anything containing{" "}
          <Code>arm64</Code>, <Code>aarch64</Code> or <Code>apple-silicon</Code>{" "}
          is served to Apple silicon; <Code>x86_64</Code> or <Code>intel</Code>{" "}
          marks the Intel build; <Code>universal</Code> or an unmarked name is
          treated as running everywhere.
        </p>

        <Card className="mt-5 p-5">
          <p className="mb-3 flex items-center gap-2 text-[12px] tracking-wide text-ash uppercase">
            <AppleIcon className="h-3.5 w-3.5" />
            A release that works well
          </p>
          <ul className="space-y-1.5 font-mono text-[12.5px] text-charcoal">
            <li>Crest-1.1.0-universal.dmg</li>
            <li>Workstation-0.1.0-macOS-arm64.zip</li>
            <li>Workstation-0.1.0-macOS-x86_64.zip</li>
          </ul>
          <p className="mt-4 text-[12px] leading-5 text-ash">
            Checksums and signatures alongside them are ignored rather than
            offered as downloads.
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-5 text-lg font-medium tracking-tight text-ink">
          Questions people actually ask
        </h2>
        <dl className="divide-y divide-hairline border-y border-hairline">
          {FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="text-[14px] font-medium text-ink">{item.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-7 text-mute">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-xs bg-deep px-1.5 py-0.5 font-mono text-[0.85em] text-charcoal">
      {children}
    </code>
  );
}
