import type { Metadata } from "next";
import type { MountainConfig } from "@/config/mountains";
import { WEBCAMS } from "@/config/webcams";

export const SITE_NAME = "OpenPeaks";

// Absolute site URL for canonical links, the sitemap and social previews.
// Every Vercel build (previews too) points at openpeaks.ca, the one canonical
// host; next.config.ts redirects every other domain there. Vercel's own
// "production domain" can't be trusted for this: it picked the old domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL ? "https://openpeaks.ca" : "http://localhost:3000")
).replace(/\/$/, "");

// A page's openGraph replaces the layout's rather than merging with it, so
// each page spreads these in.
export const OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_CA",
} as const;

export const HOME_TITLE = "Ski Conditions in BC & the Rockies";
export const HOME_DESCRIPTION =
  "Live ski conditions for 27 hills and 19 backcountry zones in BC and the Rockies, from the North Shore and Whistler to the Okanagan, Kootenays, Banff and Powder King: temperature, snow depth, freezing level, the rain-or-snow line and avalanche danger. Updated hourly.";

// Only claim webcams where the page embeds them.
const hasCams = (m: MountainConfig) => (WEBCAMS[m.id]?.cams.length ?? 0) > 0;

export const mountainTitle = (m: MountainConfig) =>
  hasCams(m)
    ? `${m.fullName} Snow Report, Webcams & Conditions`
    : `${m.fullName} Conditions: Rain or Snow & Freezing Level`;

export const mountainDescription = (m: MountainConfig) =>
  hasCams(m)
    ? `${m.fullName} conditions today and a 7-day forecast: snow depth, live webcams, new snow, freezing level, and whether it's raining or snowing at each lift. Updated hourly.`
    : `${m.fullName} conditions today and a 7-day forecast: new snow, freezing level, temperature and whether it's raining or snowing at each lift. Updated hourly.`;

// JSON-LD for a <script type="application/ld+json">, with "<" escaped so
// nothing in it can close the script tag.
export const jsonLd = (data: object) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

// A page's title, description, canonical URL and social preview. The title runs
// through the layout's template ("… | OpenPeaks"); the preview spells it out,
// since a page's openGraph replaces the layout's.
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string; // e.g. "/hills"
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH, title: `${title} | ${SITE_NAME}`, description, url: path },
  };
}

// The trail of pages above this one, from the home page, for structured data.
export function breadcrumbs(trail: { name: string; path: string }[], id?: string) {
  return {
    "@type": "BreadcrumbList",
    ...(id && { "@id": id }),
    itemListElement: [{ name: HOME_TITLE, path: "/" }, ...trail].map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}
