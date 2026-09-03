import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import "./globals.css";

// Closest free match to the General Sans / TT Talent pairing on the Prepskora
// site: geometric humanist, good at both display and UI sizes.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Appshop · Mac apps that ship from GitHub",
    template: "%s · Appshop",
  },
  description:
    "A storefront for Mac apps released straight from their GitHub repositories. Publish a repo, and every tagged release becomes a download. No uploads, no binaries in the middle.",
  openGraph: {
    title: "Appshop · Mac apps that ship from GitHub",
    description:
      "Publish a repo, and every tagged release becomes a download. Listings live here, binaries stay in your GitHub releases.",
    type: "website",
    siteName: "Appshop",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`}>
      <body className="bg-canvas text-body flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
