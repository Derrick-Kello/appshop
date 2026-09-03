import Link from "next/link";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/site-nav";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="relative flex flex-1 flex-col items-center justify-center px-5 py-16">
      <div aria-hidden className="grid-field pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-stripes pointer-events-none absolute inset-x-0 top-0 h-40 opacity-50" />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Wordmark />
        </Link>
        {children}
      </div>
    </main>
  );
}
