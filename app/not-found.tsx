import Link from "next/link";

import { Wordmark } from "@/components/site-nav";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main" className="relative flex flex-1 flex-col items-center justify-center px-5 py-24">
      <div aria-hidden className="grid-field pointer-events-none absolute inset-0" />

      <div className="relative text-center">
        <Link href="/" className="inline-flex">
          <Wordmark />
        </Link>
        <p className="mt-8 font-mono text-[13px] text-stone">404</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
          Nothing on this shelf
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-ash">
          The page you asked for isn&rsquo;t here. The store, however, is.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/apps">Browse apps</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
