import { Card, CardTitle, Figure } from "@/components/Ui";
import { Compass } from "@/components/WindCard";
import type { ZoneConfig } from "@/config/zones";
import { compass, fmt } from "@/lib/Format";
import { windAloft } from "@/lib/Model";
import type { HillNow } from "@/lib/Weather";

// Wind for a backcountry zone, as avalanche forecasts describe it: ridgetop wind
// (free air at the top of the zone's terrain, which drives wind loading) first,
// then the near-surface wind and gusts that sheltered slopes see.
export default function ZoneWindCard({ zone, now }: { zone: ZoneConfig; now: HillNow }) {
  const ridge = windAloft(now.aloft, zone.top);

  return (
    <Card>
      <CardTitle note={`Model estimates. Ridgetop wind is the free air at ~${fmt(zone.top)} m`}>
        Wind
      </CardTitle>

      <div className="mt-6 flex items-center justify-between gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted">Ridgetop</p>
            <Figure value={ridge.speed} unit="km/h" size="xl" />
            <p className="text-sm text-ink-2">From the {compass(ridge.dir)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Near the surface</p>
            <Figure value={Math.round(now.wind)} unit="km/h" />
            <p className="text-sm text-ink-2">
              Gusts {Math.round(now.gust)} km/h · from the {compass(now.dir)}
            </p>
          </div>
        </div>
        <Compass dir={ridge.dir} color={zone.color} />
      </div>

      <p className="mt-5 text-xs text-faint">
        Exposed ridges and peaks usually see the ridgetop wind; sheltered slopes and
        valleys, the near-surface wind. Humidity{" "}
        <span className="tabular-nums text-ink">{Math.round(now.rh)}%</span>.
      </p>
    </Card>
  );
}
