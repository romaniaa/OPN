import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AvalancheCard from "@/components/AvalancheCard";
import DailyForecast from "@/components/DailyForecast";
import FreezingChart from "@/components/FreezingChart";
import { Page, PageFooter, PageHeader, TITLE_ICON } from "@/components/Page";
import PinButton from "@/components/PinButton";
import RangeIcon from "@/components/RangeIcon";
import { PlaceSnowAlert } from "@/components/SnowAlert";
import { PageTransition } from "@/components/Transitions";
import ConditionChip from "@/components/ConditionChip";
import { AvalancheCanada, Card, CardTitle, OpenMeteo, SectionLabel, Unavailable } from "@/components/Ui";
import ZoneDiagram from "@/components/ZoneDiagram";
import ZoneStations from "@/components/ZoneStations";
import ZoneTemperatureChart from "@/components/ZoneTemperatureChart";
import ZoneWindCard from "@/components/ZoneWindCard";
import { ZONES, type ZoneConfig } from "@/config/zones";
import { getAvalancheForecast } from "@/lib/Avalanche";
import { conditionAt } from "@/lib/Conditions";
import { getDailyForecast, getFreezingSeries } from "@/lib/Forecast";
import { compass, fmt, precipRate, round1 } from "@/lib/Format";
import { tempAt, windAloft } from "@/lib/Model";
import { settle } from "@/lib/Settle";
import { pageMetadata } from "@/lib/Site";
import { snowAlert } from "@/lib/SnowAlert";
import { zoneSnow } from "@/lib/SnowNow";
import { getZoneStations } from "@/lib/Stations";
import { getCurrentConditions, type HillNow } from "@/lib/Weather";

export function generateStaticParams() {
  return ZONES.map((z) => ({ zone: z.id }));
}

const title = (z: ZoneConfig) => `${z.fullName} Avalanche Danger & Conditions`;
const description = (z: ZoneConfig) =>
  `${z.fullName} today: Avalanche Canada danger ratings, freezing level, and temperature and rain or snow from ${fmt(z.bottom)} to ${fmt(z.top)} m. ${z.description} Updated hourly.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zone: string }>;
}): Promise<Metadata> {
  const { zone } = await params;
  const z = ZONES.find((x) => x.id === zone);
  if (!z) return {};
  return pageMetadata({ title: title(z), description: description(z), path: `/backcountry/${z.id}` });
}

// Navigations into this page wait for it rather than showing a loading skeleton
// first. The page is static and served from the CDN, so the wait is short, and
// the whole page then arrives in one commit: the card-to-page morph (the shared
// <ViewTransition> names) only forms when the destination's content is there in
// the same commit as the navigation. Opting out also tells Next's instant-
// navigation check that reading params outside <Suspense> here is deliberate.
export const instant = false;

export default async function ZonePage({ params }: { params: Promise<{ zone: string }> }) {
  const { zone: id } = await params;
  const zone = ZONES.find((z) => z.id === id);
  if (!zone) notFound();

  return (
    <PageTransition>
      <ZoneContent zone={zone} />
    </PageTransition>
  );
}

function ElevationTable({ zone, now }: { zone: ZoneConfig; now: HillNow }) {
  const ridge = windAloft(now.aloft, zone.top);
  const details: [string, string][] = [
    ["Freezing level", `${fmt(now.freezingLevel)} m`],
    ["Precipitation", precipRate(now.precipitation)],
    ["Ridgetop wind", `${ridge.speed} km/h ${compass(ridge.dir)}`],
    ["Near-surface wind", `${Math.round(now.wind)} km/h · gusts ${Math.round(now.gust)}`],
  ];
  return (
    <Card>
      <CardTitle note="Model estimates at heights across this terrain, highest first" className="mb-4">
        Conditions by elevation
      </CardTitle>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="pb-2 font-normal">Elevation</th>
            <th className="pb-2 font-normal">Temperature</th>
            <th className="pb-2 font-normal">Now</th>
          </tr>
        </thead>
        <tbody>
          {[...zone.heights]
            .sort((a, b) => b - a)
            .map((h) => (
              <tr key={h} className="border-t border-line">
                <td className="py-2 tabular-nums text-ink">{fmt(h)} m</td>
                <td className="py-2 tabular-nums text-ink">{round1(tempAt(now.profile, h))}°</td>
                <td className="py-2">
                  <ConditionChip condition={conditionAt(h, now.freezingLevel, now)} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="mt-1 tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

async function ZoneContent({ zone }: { zone: ZoneConfig }) {
  const [forecast, now, freezing, stations, daily] = await settle([
    getAvalancheForecast(zone.id),
    getCurrentConditions().then((c) => c[zone.id]),
    getFreezingSeries([zone.id]),
    getZoneStations(zone.id),
    getDailyForecast(zone.id),
  ]);
  const snow = stations ? zoneSnow(stations) : undefined;

  return (
    <Page
      transition={false}
      banner={
        <PlaceSnowAlert
          name={`${zone.fullName} backcountry`}
          snow={snow}
          alert={snowAlert(snow, daily?.days)}
          bar
        />
      }
    >
      <PageHeader
        eyebrow="Backcountry"
        icon={<RangeIcon color={zone.color} className={TITLE_ICON} />}
        title={zone.fullName}
      >
        <p className="mt-2 max-w-3xl text-ink-2">{zone.description}</p>
        <div className="mt-4">
          <PinButton id={zone.id} name={zone.fullName} color={zone.color} size="large" />
        </div>
      </PageHeader>
      {forecast ? (
        <AvalancheCard name={zone.fullName} forecast={forecast} timeZone={zone.timeZone} />
      ) : (
        <Unavailable title={`${zone.fullName} avalanche danger`} />
      )}

      <SectionLabel>Rain and snow line, by elevation</SectionLabel>
      {now ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ZoneDiagram zone={zone} now={now} />
          <div className="lg:col-span-2">
            <ElevationTable zone={zone} now={now} />
          </div>
        </div>
      ) : (
        <Unavailable title="Conditions by elevation" />
      )}

      <SectionLabel>Forecast</SectionLabel>
      {daily && daily.days.length > 0 ? (
        <DailyForecast
          days={daily.days}
          top={{ label: "Upper", elevation: zone.top }}
          bottom={{ label: "Lower", elevation: zone.bottom }}
          color={zone.color}
        />
      ) : (
        <Unavailable title="Forecast" />
      )}

      <SectionLabel>Freezing level</SectionLabel>
      {freezing ? (
        <FreezingChart
          series={freezing}
          note={`Daily low–high range at ${zone.fullName} · Open-Meteo model`}
        />
      ) : (
        <Unavailable title="Freezing level" />
      )}

      <SectionLabel>Temperature and wind</SectionLabel>
      {now ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ZoneTemperatureChart zone={zone} now={now} />
          <ZoneWindCard zone={zone} now={now} />
        </div>
      ) : (
        <Unavailable title="Temperature and wind" />
      )}

      {zone.stations.length > 0 && (
        <>
          <SectionLabel>Weather stations</SectionLabel>
          {stations ? (
            <ZoneStations stations={stations} now={now} timeZone={zone.timeZone} />
          ) : (
            <Unavailable title="Weather stations" />
          )}
        </>
      )}

      <PageFooter>
        Avalanche danger ratings from <AvalancheCanada />. Weather is model estimates, not
        station observations; the snow line is estimated at 150 m below the freezing level.
        Weather data by <OpenMeteo />.
      </PageFooter>
    </Page>
  );
}
