import CardMore from "@/components/CardMore";
import { ConditionStrip } from "@/components/CardStats";
import { DangerChip, PlaceCardHeader } from "@/components/PlaceCard";
import { Card, NoWeather } from "@/components/Ui";
import type { ZoneConfig } from "@/config/zones";
import type { AvalancheForecast } from "@/lib/Danger";
import { compass } from "@/lib/Format";
import type { HillNow } from "@/lib/PlaceWeather";
import { tempAt, windAloft } from "@/lib/Profile";
import type { SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";

// Compact backcountry conditions for one zone: today's highest avalanche danger
// and weather at the top and bottom of its terrain. For the lists on /hills and
// /backcountry, which wrap it in a link to the zone's page.
export default function ZoneCard({
  zone,
  now,
  forecast,
  snow,
  alert,
}: {
  zone: ZoneConfig;
  now: HillNow | null;
  forecast: AvalancheForecast | null;
  snow?: SnowNow;
  alert?: SnowAlert | null;
}) {
  const ridge = now && windAloft(now.aloft, zone.top);

  return (
    <Card compact accent={zone.color} className="flex h-full flex-col">
      <PlaceCardHeader
        compact
        place={{ kind: "zone", id: zone.id, color: zone.color }}
        name={zone.fullName}
        alert={alert}
        freezingLevel={now?.freezingLevel}
      >
        <p className="text-xs text-muted">Backcountry · {zone.description}</p>
      </PlaceCardHeader>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Avalanche danger today</span>
        <DangerChip forecast={forecast} />
      </div>

      {now && ridge ? (
        <>
          <ConditionStrip
            heights={[
              { label: "Upper", elevation: zone.top, temp: tempAt(now.profile, zone.top) },
              { label: "Lower", elevation: zone.bottom, temp: tempAt(now.profile, zone.bottom) },
            ]}
            freezingLevel={now.freezingLevel}
            sky={now}
            snow={snow}
          />
          <p className="mt-3 text-sm tabular-nums text-muted">
            Ridgetop wind {ridge.speed} km/h {compass(ridge.dir)}
          </p>
        </>
      ) : (
        <NoWeather />
      )}
      <CardMore />
    </Card>
  );
}
