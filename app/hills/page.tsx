import Link from "next/link";
import { Page, PageFooter, PageHeader } from "@/components/Page";
import PlaceGrid from "@/components/PlaceGrid";
import { SnowAlertBanner } from "@/components/SnowAlert";
import { NAV_FORWARD } from "@/components/Transitions";
import { AvalancheCanada, OpenMeteo } from "@/components/Ui";
import { PLACES, PLACES_BY_REGION } from "@/lib/Place";
import { getPlacesNow } from "@/lib/Places";
import { pageMetadata } from "@/lib/Site";

export const metadata = pageMetadata({
  title: "Ski & Backcountry Conditions in BC and the Rockies",
  description:
    "Temperature, snow depth, rain or snow and freezing level right now at ski hills from the North Shore and Whistler to Vancouver Island, the Okanagan, the Kootenays, the Rockies and Northern BC, plus avalanche danger for the backcountry. Updated hourly.",
  path: "/hills",
});

export default async function HillsPage() {
  const data = await getPlacesNow();

  return (
    <Page>
      <PageHeader title="All hills and backcountry">
        <p className="mt-2 max-w-3xl text-ink-2">
          Current conditions at every ski area and backcountry zone we cover, grouped by
          region. Open one for its freezing-level forecast, and lifts or avalanche danger.{" "}
          <Link href="/" transitionTypes={NAV_FORWARD} className="underline hover:text-ink">
            Pick your favourites for My hills
          </Link>
          .
        </p>
      </PageHeader>

      <SnowAlertBanner places={PLACES} alerts={data.alerts} />

      <PlaceGrid groups={PLACES_BY_REGION} data={data} />

      <PageFooter>
        Avalanche danger from <AvalancheCanada />; open a zone for the link to its full
        forecast. Weather is model estimates, not station observations. Snow line is
        estimated at 150 m below the freezing level. Weather data by <OpenMeteo />.
      </PageFooter>
    </Page>
  );
}
