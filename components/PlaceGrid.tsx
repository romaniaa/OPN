import { PinnedCard } from "@/components/CardLink";
import HillCard from "@/components/HillCard";
import ZoneCard from "@/components/ZoneCard";
import { SectionLabel } from "@/components/Ui";
import type { Place } from "@/lib/Place";
import type { PlacesNow } from "@/lib/Places";

// The list pages' sections (/hills, /backcountry): one per region, each a grid of
// compact cards with their My hills buttons.
export default function PlaceGrid({
  groups,
  data: { now, avalanche, snow, alerts },
}: {
  groups: { region: { id: string; name: string }; places: Place[] }[];
  data: PlacesNow;
}) {
  return groups.map(({ region, places }) => (
    <section key={region.id} className="space-y-4">
      <SectionLabel>{region.name}</SectionLabel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {places.map((p) => (
          <PinnedCard key={p.id} place={p}>
            {p.kind === "hill" ? (
              <HillCard
                config={p.config}
                now={now?.[p.id] ?? null}
                snow={snow[p.id]}
                alert={alerts[p.id]}
              />
            ) : (
              <ZoneCard
                zone={p.config}
                now={now?.[p.id] ?? null}
                forecast={avalanche[p.config.id] ?? null}
                snow={snow[p.id]}
                alert={alerts[p.id]}
              />
            )}
          </PinnedCard>
        ))}
      </div>
    </section>
  ));
}
