import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-canvas text-body flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-[13px] focus:text-canvas"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
