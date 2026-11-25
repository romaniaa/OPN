import CardMore from "@/components/CardMore";
import { ConditionStrip, Readouts } from "@/components/CardStats";
import { ElevationDiagram } from "@/components/ElevationVisualizer";
import { DangerChip, PlaceCardHeader } from "@/components/PlaceCard";
import { Card, NoWeather } from "@/components/Ui";
import type { ZoneConfig } from "@/config/zones";
import type { AvalancheForecast } from "@/lib/Danger";
import { SNOW_LINE_OFFSET } from "@/lib/Conditions";
import { compass, fmt, precipRate } from "@/lib/Format";
import type { HillNow } from "@/lib/PlaceWeather";
import { tempAt, windAloft } from "@/lib/Profile";
import type { SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";

// A generic range outline: zones span many peaks, so no single ridge is drawn as
// a likeness. Its heights are scaled to the zone's terrain, so the snow line and
// the labelled heights sit at the right levels against it.
const GENERIC_RIDGE: [number, number][] = [
  [0, 0.25], [12, 0.5], [22, 0.85], [30, 0.62], [42, 1], [52, 0.7],
  [60, 0.78], [72, 0.45], [84, 0.66], [100, 0.35],
];
const BANDS = ["Upper", "Middle", "Lower"];

// The rain-and-snow-line card for a backcountry zone, the counterpart of a hill's
// ElevationVisualizer. With `forecast` it also shows today's avalanche danger and
// the weather details, for the dashboard where it sits beside hill cards.
export default function ZoneDiagram({
  zone,
  now,
  forecast,
  snow,
  alert,
  more = false,
}: {
  zone: ZoneConfig;
  now: HillNow | null;
  forecast?: AvalancheForecast | null;
  snow?: SnowNow; // dashboard only: snow at the zone's highest station with snow
  alert?: SnowAlert | null; // snowfall alert, fallen or forecast
  more?: boolean; // the card links to the zone's page: show the "Full report" footer
}) {
  const { top, bottom } = zone;
  const heights = [...zone.heights].sort((a, b) => b - a);
  const lo = bottom - 250;
  const hi = top + 120;
  const details = forecast !== undefined;
  const ridge = now && windAloft(now.aloft, top);

  return (
    <Card accent={zone.color} plate={false} className={`h-full ${more ? "flex flex-col" : ""}`}>
      <PlaceCardHeader
        place={{ kind: "zone", id: zone.id, color: zone.color }}
        name={zone.name}
        alert={alert}
        freezingLevel={now?.freezingLevel}
      >
        <p className="font-sans text-xs tabular-nums text-muted">
          {details ? "Backcountry · " : ""}
          {fmt(bottom)}–{fmt(top)} m terrain
        </p>
      </PlaceCardHeader>

      {details && now && (
        <ConditionStrip
          heights={[
            { label: "Upper", elevation: top, temp: tempAt(now.profile, top) },
            { label: "Lower", elevation: bottom, temp: tempAt(now.profile, bottom) },
          ]}
          freezingLevel={now.freezingLevel}
          sky={now}
          snow={snow}
        />
      )}

      {now ? (
        <ElevationDiagram
          id={zone.id}
          name={zone.fullName}
          min={bottom - 400}
          max={top + 250}
          profile={GENERIC_RIDGE.map(([x, f]) => [x, Math.round(lo + f * (hi - lo))])}
          landmarks={heights.map((h, i) => ({ name: BANDS[i] ?? "", elevation: h }))}
          color={zone.color}
          freezingLevel={now.freezingLevel}
          sky={now}
        />
      ) : (
        <NoWeather />
      )}
      <p className="mt-1 text-xs text-faint">
        Heights are to scale; the ridge is a generic outline.
      </p>

      {details && (
        <>
          {now && ridge && (
            <Readouts
              items={[
                ["Precip", precipRate(now.precipitation)],
                ["Ridgetop wind", `${ridge.speed} km/h ${compass(ridge.dir)}`],
                ["Snow line (est.)", `~${fmt(now.freezingLevel - SNOW_LINE_OFFSET)} m`],
              ]}
            />
          )}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-2 pt-4 text-sm">
            <div>
              <p className="text-xs text-muted">Avalanche danger today</p>
              <p className="text-ink">
                {forecast?.status === "ok" ? forecast.owner : "Avalanche Canada"}
              </p>
            </div>
            <DangerChip forecast={forecast} />
          </div>
        </>
      )}
      {more && <CardMore />}
    </Card>
  );
}
