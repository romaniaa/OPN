import type { Metadata } from "next";
import Link from "next/link";
import { PinnedCard } from "@/components/CardLink";
import ElevationVisualizer from "@/components/ElevationVisualizer";
import { JsonLd, Page, PageFooter, PageHeader } from "@/components/Page";
import PlaceIcon from "@/components/PlaceIcon";
import TemperatureChart from "@/components/TemperatureChart";
import { NAV_FORWARD, SharedTransition } from "@/components/Transitions";
import { AvalancheCanada, OpenMeteo, SectionLabel, Unavailable } from "@/components/Ui";
import WindChart from "@/components/WindChart";
import ZoneDiagram from "@/components/ZoneDiagram";
import { AREAS, regionById, type RegionId } from "@/config/regions";
import { getPointReadings } from "@/lib/Forecast";
import { PLACES } from "@/lib/Place";
import { EMPTY_PLACES_NOW, getPlacesNow } from "@/lib/Places";
import { settle } from "@/lib/Settle";
import { breadcrumbs, pageMetadata } from "@/lib/Site";
import { weatherFrom } from "@/lib/Weather";

export function regionMetadata(id: RegionId): Metadata {
  const r = regionById(id);
  return pageMetadata({ title: r.title, description: r.description, path: `/${r.id}` });
}

// One region (/coast, /okanagan…): the rain-and-snow-line card for each hill and
// backcountry zone, sectioned by area, then temperature and wind at every lift.
// Everything comes from the shared hourly caches, so the page is static.
export default async function RegionPage({ id }: { id: RegionId }) {
  const region = regionById(id);
  const places = PLACES.filter((p) => p.region === id);
  const areas = AREAS.filter((a) => places.some((p) => p.area === a.id));

  const [placesNow, readings] = await settle([getPlacesNow(), getPointReadings(id)]);
  const { now, avalanche, snow, alerts } = placesNow ?? EMPTY_PLACES_NOW;

  // Each hill's top-lift reading, for the wind chart.
  const tops = places.flatMap((p) => {
    if (p.kind !== "hill") return [];
    const reading = readings?.find((r) => r.id === `${p.id}-top`);
    return reading ? [{ m: p.config, reading }] : [];
  });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...breadcrumbs([{ name: `${region.name} ski conditions`, path: `/${id}` }]),
        }}
      />
      <Page>
        <PageHeader title={`${region.name} ski conditions`}>
          <p className="mt-2 max-w-3xl text-ink-2">
            {region.intro} Rain or snow, temperature and snow depth for each, updated hourly.
          </p>
          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
            {places.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.href}
                  transitionTypes={NAV_FORWARD}
                  className="flex items-center gap-1.5 hover:text-ink hover:underline"
                >
                  <PlaceIcon place={p} className="h-3 w-4" />
                  {p.fullName}
                  {p.kind === "zone" && " backcountry"}
                </Link>
              </li>
            ))}
          </ul>
        </PageHeader>

        {areas.map((area) => (
          <section key={area.id} className="space-y-4">
            <SectionLabel>{areas.length > 1 ? area.name : "Rain and snow line"}</SectionLabel>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {places
                .filter((p) => p.area === area.id)
                .map((p) => (
                  <PinnedCard key={p.id} place={p}>
                    {p.kind === "hill" ? (
                      <SharedTransition name={`resort-${p.id}`}>
                        <ElevationVisualizer
                          config={p.config}
                          weather={now?.[p.id] ? weatherFrom(now[p.id], p.config) : null}
                          snow={snow[p.id]}
                          alert={alerts[p.id]}
                          more
                        />
                      </SharedTransition>
                    ) : (
                      <ZoneDiagram
                        zone={p.config}
                        now={now?.[p.id] ?? null}
                        forecast={avalanche[p.config.id] ?? null}
                        snow={snow[p.id]}
                        alert={alerts[p.id]}
                        more
                      />
                    )}
                  </PinnedCard>
                ))}
            </div>
          </section>
        ))}

        <SectionLabel>Temperature and wind</SectionLabel>
        {readings && tops.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TemperatureChart readings={readings} />
            <WindChart
              rows={tops.map(({ m, reading }) => ({
                label: m.name,
                mountain: m.id,
                color: m.color,
                avg: reading.wind,
                gust: reading.gust,
              }))}
            />
          </div>
        ) : (
          <Unavailable title="Temperature and wind" />
        )}

        <PageFooter>
          Model estimates, not station observations. Snow line is estimated at 150 m below
          the freezing level. Snow depth from each resort&apos;s report, and for the
          backcountry from Avalanche Canada weather stations. Avalanche danger from{" "}
          <AvalancheCanada />. Weather data by <OpenMeteo />.
        </PageFooter>
      </Page>
    </>
  );
}
