"use client";

import { useEffect } from "react";
import { CardLink } from "@/components/CardLink";
import ElevationVisualizer from "@/components/ElevationVisualizer";
import { SharedTransition } from "@/components/Transitions";
import { useDashboard } from "@/components/useDashboard";
import ZoneDiagram from "@/components/ZoneDiagram";
import type { AvalancheForecast } from "@/lib/Danger";
import { placeById } from "@/lib/Place";
import { weatherFrom, type HillNow } from "@/lib/PlaceWeather";
import type { SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";

// What one card needs, for every place. A few hundred bytes each, so the page
// can carry all of them and draw whichever the visitor picked.
export interface CardData {
  now: HillNow | null;
  avalanche?: AvalancheForecast | null; // zones only, trimmed to today
  snow?: SnowNow;
  alert?: SnowAlert;
}

function PlaceCard({ id, data }: { id: string; data: CardData | undefined }) {
  const place = placeById(id);
  if (!place) return null;
  return (
    <div data-place={id} className="flex flex-col">
      <CardLink place={place}>
        {place.kind === "hill" ? (
          <SharedTransition name={`resort-${id}`}>
            <ElevationVisualizer
              config={place.config}
              weather={data?.now ? weatherFrom(data.now, place.config) : null}
              snow={data?.snow}
              alert={data?.alert}
              more
            />
          </SharedTransition>
        ) : (
          <ZoneDiagram
            zone={place.config}
            now={data?.now ?? null}
            forecast={data?.avalanche ?? null}
            snow={data?.snow}
            alert={data?.alert}
            more
          />
        )}
      </CardLink>
    </div>
  );
}

// The cards on My hills, in the visitor's order. On the server (and in the first
// render in the browser) that's the default North Shore hills, so the page's HTML
// holds three cards rather than every place; after hydration it's the visitor's
// own pick. Until then the inline script hides defaults that aren't picked and
// shows placeholders for picks that aren't drawn yet (lib/Dashboard.ts).
export default function MyHillsCards({ data }: { data: Record<string, CardData> }) {
  const { hydrated, ids } = useDashboard();

  useEffect(() => {
    if (hydrated) document.getElementById("dashboard")?.removeAttribute("data-pending");
  }, [hydrated]);

  return (
    <>
      {ids.map((id) => (
        <PlaceCard key={id} id={id} data={data[id]} />
      ))}
    </>
  );
}
