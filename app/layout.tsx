import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Suspense } from "react";
import SiteAnalytics from "@/components/SiteAnalytics";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Topo from "@/components/Topo";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  OPEN_GRAPH,
  SITE_NAME,
  SITE_URL,
} from "@/lib/Site";
import { THEME_SCRIPT } from "@/lib/Theme";
import "./globals.css";

// Archivo is variable in weight and width: one file covers body text and the
// condensed headings (wdth 75, set in globals.css).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${HOME_TITLE} | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: OPEN_GRAPH,
  twitter: { card: "summary_large_image" },
};

// Edge to edge on phones with a notch or home bar, so the bottom nav can sit
// clear of it (env(safe-area-inset-bottom)).
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-CA"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
      // The theme script sets data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="relative flex min-h-full flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] font-sans md:pb-0">
        <Topo />
        {/* In the layout, not each page, so the nav stays mounted across
            navigations and its tabs can animate from one state to the next. */}
        <Suspense>
          <SiteNav />
        </Suspense>
        {children}
        <SiteFooter />
        <SiteAnalytics />
      </body>
    </html>
  );
}
