import type { Metadata } from "next";

import { AppleIcon, CheckIcon, GitHubIcon } from "@/components/icons";
import { ButtonLink, Card, Panel } from "@/components/ui";

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
    <>
      <div className="wash-soft -mt-19 rounded-b-3xl pt-19">
        <div className="mx-auto max-w-3xl px-5 pt-14 pb-14 sm:pt-20">
          <h1 className="display text-[42px] sm:text-[54px]">
            Publishing on Appshop
          </h1>
          <p className="mt-5 text-[17px] leading-8 text-muted">
            Appshop is a storefront on top of GitHub releases. There is no upload
            step because there is nothing to upload: the listing is metadata, and
            the download resolves against your repository every time it&rsquo;s
            clicked.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard/new" size="lg">
              <GitHubIcon />
              Publish an app
            </ButtonLink>
            <ButtonLink href="/sign-up" variant="outline" size="lg">
              Create an account
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <Panel className="p-8">
          <h2 className="text-[15px] font-semibold text-ink">What you need</h2>
          <ul className="mt-5 space-y-3.5">
            {REQUIREMENTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[16px] leading-7 text-body">
                <CheckIcon className="mt-1 h-4.5 w-4.5 shrink-0 text-good" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <section className="mt-14">
          <h2 className="display-sm text-[28px]">Naming your release assets</h2>
          <p className="mt-4 text-[16px] leading-8 text-body">
            The store reads the architecture out of the filename, so a release that
            ships more than one build should say which is which. Anything
            containing <Code>arm64</Code>, <Code>aarch64</Code> or{" "}
            <Code>apple-silicon</Code> is served to Apple silicon;{" "}
            <Code>x86_64</Code> or <Code>intel</Code> marks the Intel build;{" "}
            <Code>universal</Code> or an unmarked name is treated as running
            everywhere.
          </p>

          <Card className="mt-6 p-6">
            <p className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-ink">
              <AppleIcon className="h-4 w-4" />
              A release that works well
            </p>
            <ul className="space-y-2 font-mono text-[14px] text-ink-2">
              <li>Crest-1.1.0-universal.dmg</li>
              <li>Workstation-0.1.0-macOS-arm64.zip</li>
              <li>Workstation-0.1.0-macOS-x86_64.zip</li>
            </ul>
            <p className="mt-5 text-[14px] leading-6 text-muted">
              Checksums and signatures alongside them are ignored rather than
              offered as downloads.
            </p>
          </Card>
        </section>

        <section className="mt-14">
          <h2 className="display-sm mb-6 text-[28px]">Questions people actually ask</h2>
          <dl className="divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-[17px] font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 text-[16px] leading-8 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.88em] text-ink-2">
      {children}
    </code>
  );
}
