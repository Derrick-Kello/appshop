import Link from "next/link";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/site-nav";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="wash flex flex-1 flex-col items-center justify-center px-5 py-16"
    >
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Wordmark />
        </Link>
        {children}
      </div>
    </main>
  );
}
