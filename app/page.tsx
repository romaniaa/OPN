import type { Metadata } from "next";
import DashboardControls from "@/components/DashboardControls";
import Headline from "@/components/Headline";
import Link from "next/link";
import MyHillsCards, { type CardData } from "@/components/MyHillsCards";
import { NAV_FADE, PageTransition } from "@/components/Transitions";
import { Eyebrow, PillLink, SectionLabel } from "@/components/Ui";
import { REGIONS } from "@/config/regions";
import { ZONES, type ZoneId } from "@/config/zones";
import { DASHBOARD_CSS, INLINE_SCRIPT, PLACE_IDS } from "@/lib/Dashboard";
import type { PlaceId } from "@/lib/Model";
import { getPlacesNow } from "@/lib/Places";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  OPEN_GRAPH,
  SITE_NAME,
  SITE_URL,
  jsonLd,
} from "@/lib/Site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    ...OPEN_GRAPH,
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: "/",
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  description: HOME_DESCRIPTION,
  inLanguage: "en-CA",
};

// The home page is the visitor's own dashboard, My hills: the North Shore hills
// until they pick their own. It's static and served from the CDN, so a visit
// costs no server work or API calls. The HTML holds only the default cards; the
// page carries compact data for every place and draws the visitor's picks in
// the browser (components/MyHillsCards.tsx).
export default async function Home() {
  const { now, avalanche, snow, alerts } = await getPlacesNow();

  // Everything a card needs, for every place. Zones' forecasts are cut to today,
  // the only day a card shows.
  const cards: Record<string, CardData> = {};
  for (const id of PLACE_IDS) {
    const zone = ZONES.some((z) => z.id === id);
    const f = zone ? (avalanche[id as ZoneId] ?? null) : undefined;
    cards[id] = {
      now: now?.[id as PlaceId] ?? null,
      snow: snow[id as PlaceId],
      alert: alerts[id as PlaceId],
      ...(zone && {
        avalanche: f?.status === "ok" ? { ...f, days: f.days.slice(0, 1), problems: [] } : f,
      }),
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED_DATA) }}
      />
      <PageTransition>
        <main className="min-h-screen px-4 py-8 text-ink md:px-10">
          {/* data-dash is set by the inline script before React hydrates. */}
          <div id="dashboard" className="mx-auto max-w-8xl space-y-6" suppressHydrationWarning>
            <script dangerouslySetInnerHTML={{ __html: INLINE_SCRIPT }} />
            <style>{DASHBOARD_CSS}</style>

            {/* Eyebrow, a headline (a different one each visit), then one line
                in full colour and the rest muted: the point first, the detail
                after. */}
            <header className="page-header">
              <Eyebrow>freezing level · temperature · snow depth · avalanche danger</Eyebrow>
              <Headline className="mt-3 max-w-5xl text-4xl font-extrabold sm:text-5xl md:text-6xl" />
              <p className="mt-4 max-w-2xl leading-relaxed text-ink md:text-lg">
                Your hills on one page: the snow line, how cold it is at each lift, snow
                depth and avalanche danger.{" "}
                <span className="text-muted">
                  Pick the ones you ride and they&apos;ll be here when you come
                  back. No account needed.
                </span>
              </p>
              <DashboardControls />
            </header>

            <p className="dash-empty border border-dashed border-line-2 p-6 text-ink-2">
              <span className="text-ink">Nothing here yet!</span> Hit{" "}
              <span className="whitespace-nowrap text-ink">Pick your hills</span> above, or{" "}
              <span className="whitespace-nowrap text-ink">+ Add to My hills</span> on{" "}
              <Link href="/hills" transitionTypes={NAV_FADE} className="underline hover:text-ink">
                All hills
              </Link>{" "}
              or any hill&apos;s page. They&apos;ll be waiting for you next time.
            </p>

            {/* The same rain-and-snow-line cards as the overview, each linking to
                its page; zones get the generic-ridge version with avalanche danger.
                Drawn in the browser from compact data, so the page doesn't carry
                every card (components/MyHillsCards.tsx). */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <MyHillsCards data={cards} />
              {[0, 1, 2].map((i) => (
                <div key={i} className="dash-skel h-[640px] border border-line bg-surface" />
              ))}
            </div>

            <SectionLabel numbered={false}>
              {/* Small mono caps, like a section's 01 count and the page's eyebrow. */}
              <span className="font-mono text-xs font-normal tracking-[0.14em] text-muted">
                Explore
              </span>
            </SectionLabel>
            {/* Its own block rather than the label's note, so the page's spacing
                sits between the rule, this line and the links. */}
            <p className="text-muted">More Hills and Zones to keep track of.</p>
            <ul className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <li key={r.id}>
                  <PillLink href={`/${r.id}`} secondary>
                    {r.name}
                  </PillLink>
                </li>
              ))}
              <li>
                <PillLink href="/backcountry" secondary>
                  Backcountry
                </PillLink>
              </li>
            </ul>

            <footer className="pb-4 pt-6 text-xs text-faint">
              Heads up: the weather here is a computer model&apos;s best guess, not a
              reading from the hill. Avalanche danger comes from{" "}
              <a href="https://avalanche.ca" className="underline hover:text-ink">
                Avalanche Canada
              </a>
              , and weather data from{" "}
              <a href="https://open-meteo.com" className="underline hover:text-ink">
                Open-Meteo.com
              </a>
              .
            </footer>
          </div>
        </main>
      </PageTransition>
    </>
  );
}
