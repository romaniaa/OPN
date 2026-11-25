import CardMore from "@/components/CardMore";
import { ConditionStrip } from "@/components/CardStats";
import { PlaceCardHeader } from "@/components/PlaceCard";
import { Card, NoWeather } from "@/components/Ui";
import type { MountainConfig } from "@/config/mountains";
import { extremes, verdict } from "@/lib/Conditions";
import { fmt } from "@/lib/Format";
import type { HillNow } from "@/lib/PlaceWeather";
import { tempAt } from "@/lib/Profile";
import type { SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";

// Compact current conditions for one hill, for the list on /hills. The page
// wraps it in a link to the hill's page (components/CardLink.tsx).
export default function HillCard({
  config,
  now,
  snow,
  alert,
}: {
  config: MountainConfig;
  now: HillNow | null;
  snow?: SnowNow;
  alert?: SnowAlert | null;
}) {
  const { low, high } = extremes(config);

  return (
    <Card compact accent={config.color} className="flex h-full flex-col">
      <PlaceCardHeader
        compact
        place={{ kind: "hill", id: config.id, color: config.color }}
        name={config.fullName}
        alert={alert}
        freezingLevel={now?.freezingLevel}
      >
        <p className="text-xs tabular-nums text-muted">
          {config.locality} · {fmt(low)}–{fmt(high)} m lifts
        </p>
      </PlaceCardHeader>

      {now ? (
        <>
          <ConditionStrip
            heights={[
              { label: "Top", elevation: high, temp: tempAt(now.profile, high) },
              { label: "Base", elevation: low, temp: tempAt(now.profile, low) },
            ]}
            freezingLevel={now.freezingLevel}
            sky={now}
            snow={snow}
          />
          <p className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
            <span className="text-ink-2">{verdict(config, now.freezingLevel, now)}</span>
            <span className="tabular-nums text-muted">
              Wind {Math.round(now.wind)} km/h · gusts {Math.round(now.gust)}
            </span>
          </p>
        </>
      ) : (
        <NoWeather />
      )}
      <CardMore />
    </Card>
  );
}
