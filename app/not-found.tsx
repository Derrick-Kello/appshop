import Link from "next/link";

import { Wordmark } from "@/components/site-nav";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center px-5 py-24">
      <div className="text-center">
        <Link href="/" className="inline-flex">
          <Wordmark />
        </Link>
        <p className="mt-10 text-[15px] font-medium text-brand">404</p>
        <h1 className="display-sm mt-2 text-[32px]">Nothing on this shelf</h1>
        <p className="mx-auto mt-3 max-w-sm text-[16px] leading-7 text-muted">
          The page you asked for isn&rsquo;t here. The store, however, is.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/apps">Browse apps</ButtonLink>
          <ButtonLink href="/" variant="outline">
            Home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
