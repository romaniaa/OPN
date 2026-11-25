import { Page, PageFooter, PageHeader } from "@/components/Page";
import PlaceGrid from "@/components/PlaceGrid";
import { SnowAlertBanner } from "@/components/SnowAlert";
import { AvalancheCanada, OpenMeteo } from "@/components/Ui";
import { PLACES, PLACES_BY_REGION } from "@/lib/Place";
import { getPlacesNow } from "@/lib/Places";
import { pageMetadata } from "@/lib/Site";

export const metadata = pageMetadata({
  title: "Backcountry Conditions & Avalanche Danger in BC and the Rockies",
  description:
    "Today's avalanche danger, temperature by elevation, ridgetop wind and snow depth for Mt. Strachan, Whistler, the Sunshine Coast, Duffey Lake, Coquihalla, Rogers Pass, Kananaskis and the Icefields Parkway. Updated hourly.",
  path: "/backcountry",
});

const ZONES = PLACES.filter((p) => p.kind === "zone");
const GROUPS = PLACES_BY_REGION.map((g) => ({
  ...g,
  places: g.places.filter((p) => p.kind === "zone"),
})).filter((g) => g.places.length > 0);

// Every backcountry zone by region, with today's avalanche danger and weather.
export default async function BackcountryPage() {
  const data = await getPlacesNow();

  return (
    <Page>
      <PageHeader title="Backcountry">
        <p className="mt-2 max-w-3xl text-ink-2">
          Avalanche danger, temperature at each elevation, ridgetop wind and snow depth for
          popular touring areas. A summary, not the forecast: read the full avalanche
          forecast before heading out, and travel in avalanche terrain only with training
          and rescue gear.
        </p>
      </PageHeader>

      <SnowAlertBanner places={ZONES} alerts={data.alerts} />

      <PlaceGrid groups={GROUPS} data={data} />

      <PageFooter>
        Avalanche danger from <AvalancheCanada />. Snow depth from Avalanche Canada weather
        stations. Weather is model estimates. Weather data by <OpenMeteo />.
      </PageFooter>
    </Page>
  );
}
