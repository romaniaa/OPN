import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DailyForecast from "@/components/DailyForecast";
import ElevationVisualizer from "@/components/ElevationVisualizer";
import FreezingChart from "@/components/FreezingChart";
import LiftTable from "@/components/LiftTable";
import LiftTemperatureChart from "@/components/LiftTemperatureChart";
import MountainIcon from "@/components/MountainIcon";
import { JsonLd, Page, PageFooter, PageHeader, TITLE_ICON } from "@/components/Page";
import PinButton from "@/components/PinButton";
import SnowDepthCard from "@/components/SnowDepthCard";
import { PlaceSnowAlert } from "@/components/SnowAlert";
import Summary from "@/components/Summary";
import { PageTransition, SharedTransition } from "@/components/Transitions";
import { OpenMeteo, SectionLabel, Unavailable } from "@/components/Ui";
import WebcamGallery from "@/components/WebcamGallery";
import WindCard from "@/components/WindCard";
import { LIFTS } from "@/config/lifts";
import { MOUNTAINS, type MountainConfig } from "@/config/mountains";
import { regionById } from "@/config/regions";
import { WEBCAMS } from "@/config/webcams";
import { extremes, verdict, vertical } from "@/lib/Conditions";
import { getDailyForecast, getFreezingSeries, getMountainReadings } from "@/lib/Forecast";
import { fmt } from "@/lib/Format";
import { settle } from "@/lib/Settle";
import {
  SITE_URL,
  breadcrumbs,
  mountainDescription,
  mountainTitle,
  pageMetadata,
} from "@/lib/Site";
import { REPORT_PAGES } from "@/lib/SnowReaders";
import { snowAlert } from "@/lib/SnowAlert";
import { hillSnow, snowFromStation, type SnowNow } from "@/lib/SnowNow";
import { getSnowReport, type SnowReport } from "@/lib/SnowReport";
import { getHillSnowStation } from "@/lib/Stations";
import { getMountainWeather } from "@/lib/Weather";

export function generateStaticParams() {
  return MOUNTAINS.map((m) => ({ mountain: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mountain: string }>;
}): Promise<Metadata> {
  const { mountain } = await params;
  const m = MOUNTAINS.find((x) => x.id === mountain);
  if (!m) return {};

  return pageMetadata({
    title: mountainTitle(m),
    description: mountainDescription(m),
    path: `/${m.id}`,
  });
}

// Tells search engines what the page is about: a conditions page for a
// named ski area, sitting under the overview.
function structuredData(m: MountainConfig) {
  const url = `${SITE_URL}/${m.id}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: mountainTitle(m),
        description: mountainDescription(m),
        inLanguage: "en-CA",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${url}#resort` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "SkiResort",
        "@id": `${url}#resort`,
        name: m.fullName,
        url: m.website,
        geo: {
          "@type": "GeoCoordinates",
          latitude: m.lat,
          longitude: m.lon,
          elevation: m.lifts.top.elevation,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: m.locality,
          addressRegion: m.province,
          addressCountry: m.country,
        },
      },
      breadcrumbs(
        [
          { name: `${regionById(m.region).name} ski conditions`, path: `/${m.region}` },
          { name: m.fullName, path: `/${m.id}` },
        ],
        `${url}#breadcrumb`
      ),
    ],
  };
}

// Navigations into this page wait for it rather than showing a loading skeleton
// first. The page is static and served from the CDN, so the wait is short, and
// the whole page then arrives in one commit: the card-to-page morph (the shared
// <ViewTransition> names) only forms when the destination's content is there in
// the same commit as the navigation. Opting out also tells Next's instant-
// navigation check that reading params outside <Suspense> here is deliberate.
export const instant = false;

// The hill is looked up before anything renders, so an unknown URL shows the
// not-found page with a noindex tag.
export default async function MountainPage({
  params,
}: {
  params: Promise<{ mountain: string }>;
}) {
  const { mountain: id } = await params;
  const config = MOUNTAINS.find((m) => m.id === id);
  if (!config) notFound();

  return (
    <>
      <JsonLd data={structuredData(config)} />
      <PageTransition>
        <MountainContent config={config} />
      </PageTransition>
    </>
  );
}

// "Dry · fog" → "dry with fog", "Snow above 1630 m" → "snow above 1630 m".
function phrase(v: string) {
  const [first, sky] = v.split(" · ");
  const lead = first.charAt(0).toLowerCase() + first.slice(1);
  if (!sky) return lead;
  return sky === "fog" ? `${lead} with fog` : `${lead} and ${sky}`;
}

// One plain-language paragraph of current conditions. It gives search engines
// and people a readable answer before the charts.
function Intro({
  config,
  sky,
  freezingLevel,
  snow,
  stationSnow,
}: {
  config: MountainConfig;
  sky: { precipitation: number; cloud: number | null; code: number | null } | null;
  freezingLevel: number | null;
  snow: SnowReport | null;
  stationSnow: SnowNow | undefined; // the sensor beside the hill, when reporting
}) {
  const now =
    freezingLevel != null
      ? `Right now on ${config.fullName}: ${phrase(verdict(config, freezingLevel, sky ?? undefined))}. Freezing level ${fmt(freezingLevel)} m.`
      : null;
  const depth =
    snow?.status === "ok"
      ? `The resort reports ${snow.depths
          .map((d) => `${fmt(d.cm)} cm at the ${d.label.toLowerCase()}`)
          .join(" and ")}.`
      : stationSnow
        ? `The snow sensor beside the hill (${stationSnow.where}) reads ${fmt(stationSnow.cm)} cm.`
        : null;

  const cams = (WEBCAMS[config.id]?.cams.length ?? 0) > 0;

  return (
    <p className="mt-5 max-w-2xl leading-relaxed text-ink md:text-lg">
      {[now, depth].filter(Boolean).join(" ")}{" "}
      <span className="text-muted">
        Scroll on for {cams ? "the webcams, " : ""}what&apos;s falling at each lift and
        the 7-day forecast for this {config.locality} ski area. Fresh every hour.
      </span>
    </p>
  );
}

async function MountainContent({ config }: { config: MountainConfig }) {
  const lifts = LIFTS[config.id];
  const webcams = WEBCAMS[config.id];

  const [weather, stations, freezing, snowRes, daily, snowStationRes] = await settle([
    getMountainWeather(config),
    getMountainReadings(config.id),
    getFreezingSeries([config.id]),
    // Wrapped, so a failed read (null) can be told from no report this season
    // ({ report: null }), when the section is hidden.
    getSnowReport(config.id).then((report) => ({ report })),
    getDailyForecast(config.id),
    getHillSnowStation(config.id),
  ]);
  const snow = snowRes?.report ?? null;
  // The snow sensor beside the hill, used in the snow season when the resort has
  // no figures (and shown as a check when it does).
  const inSeason = snow != null || snowRes == null;
  const snowStation = inSeason ? snowStationRes : null;

  const freezingLevel = weather?.freezingLevel ?? freezing?.current ?? null;
  const { low, high } = extremes(config);

  // Reading at the highest station, used for wind and the summary.
  const topStation = stations?.[0] ?? null;
  const hillSnowNow = hillSnow(snow, snowStation);
  const alert = snowAlert(hillSnowNow, daily?.days);

  return (
    <Page
      transition={false}
      className="space-y-6"
      banner={<PlaceSnowAlert name={config.fullName} snow={hillSnowNow} alert={alert} bar />}
    >
      <PageHeader
        eyebrow={`${config.locality} · ${regionById(config.region).name}`}
        icon={<MountainIcon id={config.id} color={config.color} className={TITLE_ICON} />}
        title={config.fullName}
      >
        <p className="mt-3 text-sm tabular-nums text-muted">
          {fmt(low)}–{fmt(high)} m lifts · {fmt(vertical(config))} m vertical ·{" "}
          {config.lat.toFixed(3)}°N {Math.abs(config.lon).toFixed(3)}°W
        </p>
        <Intro
          config={config}
          sky={weather}
          freezingLevel={freezingLevel}
          snow={snow}
          stationSnow={snowFromStation(snowStation)}
        />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <PinButton id={config.id} name={config.fullName} color={config.color} size="large" />
          {freezing && (
            <p className="text-xs text-faint">Model data · updated {freezing.updated}</p>
          )}
        </div>
      </PageHeader>

      {/* Summary and snow depth share a row on desktop. Outside the snow
          season there is no depth card, so the summary takes the full width. */}
      <div className={`grid grid-cols-1 gap-5 ${inSeason ? "lg:grid-cols-5" : ""}`}>
        <div className="lg:col-span-3">
          {freezing && weather && topStation ? (
            <Summary
              compact
              title={`${config.name} summary`}
              freezing={freezing}
              precip={[{ name: config.name, precipitation: weather.precipitation }]}
              gusts={[{ name: config.name, gust: topStation.gust }]}
              cloud={topStation.cloud}
            />
          ) : (
            <Unavailable title={`${config.name} summary`} />
          )}
        </div>
        {inSeason && (
          <div className="lg:col-span-2">
            <SnowDepthCard
              name={config.name}
              report={snow}
              station={snowStation}
              url={REPORT_PAGES[config.id]}
              timeZone={config.timeZone}
            />
          </div>
        )}
      </div>

      {webcams && (
        <>
          <SectionLabel note="See it for yourself, live from the hill.">Webcams</SectionLabel>
          <WebcamGallery name={config.name} webcams={webcams} />
        </>
      )}

      <SectionLabel note="What's falling at each lift, from the base to the top.">
        Rain and snow line, and lifts
      </SectionLabel>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SharedTransition name={`resort-${config.id}`}>
          <ElevationVisualizer config={config} weather={weather} snow={hillSnowNow} alert={alert} />
        </SharedTransition>
        <div className="lg:col-span-2">
          {stations && freezingLevel != null ? (
            <LiftTable
              lifts={lifts}
              stations={stations}
              freezingLevel={freezingLevel}
              color={config.color}
            />
          ) : (
            <Unavailable title="Lifts" />
          )}
        </div>
      </div>

      <SectionLabel note="The week ahead, at the top and at the base.">Forecast</SectionLabel>
      {daily && daily.days.length > 0 ? (
        <DailyForecast
          days={daily.days}
          top={{ label: "Top", elevation: high }}
          bottom={{ label: "Base", elevation: low }}
          color={config.color}
        />
      ) : (
        <Unavailable title="Forecast" />
      )}

      <SectionLabel note="Where 0° sits on the mountain, and where it's heading.">
        Freezing level
      </SectionLabel>
      {freezing ? (
        <SharedTransition name="freezing">
          <FreezingChart
            series={freezing}
            note={`Daily low–high range at ${config.fullName} · Open-Meteo model`}
          />
        </SharedTransition>
      ) : (
        <Unavailable title="Freezing level" />
      )}

      <SectionLabel note="How cold it is at each lift, and how hard it's blowing up top.">
        Temperature and wind
      </SectionLabel>
      {stations && topStation ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <LiftTemperatureChart
            lifts={lifts}
            stations={stations}
            color={config.color}
            mountain={config.id}
          />
          <WindCard station={topStation} color={config.color} />
        </div>
      ) : (
        <Unavailable title="Temperature and wind" />
      )}

      <PageFooter className="pt-10">
        Heads up: these are computer-model estimates, not readings from the hill. The snow
        line is our guess at 150 m below the freezing level. Weather data by <OpenMeteo />.
      </PageFooter>
    </Page>
  );
}
