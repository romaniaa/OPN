import Link from "next/link";
import type { CSSProperties } from "react";
import CardMore from "@/components/CardMore";
import { SnowStat, StatStrip, TempStat } from "@/components/CardStats";
import { DANGER_STYLE } from "@/lib/DangerStyle";
import RangeIcon from "@/components/RangeIcon";
import { SnowAlertChip } from "@/components/SnowAlert";
import { NAV_FORWARD } from "@/components/Transitions";
import type { ZoneConfig } from "@/config/zones";
import { highestDanger, type AvalancheForecast } from "@/lib/Avalanche";
import { conditionAt, fmt } from "@/lib/Conditions";
import { tempAt, windAloft } from "@/lib/Model";
import { compass } from "@/components/WindCard";
import type { SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";
import type { HillNow } from "@/lib/Weather";

// Compact backcountry conditions for one zone: today's highest avalanche danger
// and weather at the top and bottom of its terrain. Used on /hills and the dashboard.
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
  const top = Math.max(...zone.heights);
  const bottom = Math.min(...zone.heights);
  const today = forecast?.status === "ok" ? forecast.days[0] : undefined;
  const level = today ? highestDanger(today) : null;
  const sky = now && { precipitation: now.precipitation, cloud: now.cloud, code: now.code };
  const ridge = now ? windAloft(now.aloft, top) : null;

  return (
    <Link
      href={`/backcountry/${zone.id}`}
      transitionTypes={NAV_FORWARD}
      className="group block h-full transition-shadow hover:shadow-[0_0_0_2px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
      style={{ "--accent": zone.color } as CSSProperties}
    >
      <section
        className="plate flex h-full flex-col border border-line bg-surface p-4"
        style={{ borderTop: `3px solid ${zone.color}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
              <RangeIcon color={zone.color} className="h-3.5 w-5" />
              <span className="truncate">{zone.fullName}</span>
            </h3>
            <p className="text-xs text-muted">Backcountry · {zone.description}</p>
            {alert && (
              <p className="mt-1.5">
                <SnowAlertChip alert={alert} />
              </p>
            )}
          </div>
          {now && (
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-bold tabular-nums text-ink">
                {fmt(now.freezingLevel)}
                <span className="ml-0.5 text-xs font-normal text-muted">m</span>
              </p>
              <p className="text-xs text-muted">Freezing level</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Avalanche danger today</span>
          {forecast == null ? (
            <span className="chip bg-ink/10 text-ink-2">Unavailable</span>
          ) : level ? (
            <span className={`chip ${DANGER_STYLE[level].chip}`}>
              Up to {DANGER_STYLE[level].label}
            </span>
          ) : (
            <span className="chip bg-ink/10 text-ink-2">
              {forecast.status === "ok" ? (forecast.note ?? "No rating") : "No current forecast"}
            </span>
          )}
        </div>

        {now && sky ? (
          <>
            <StatStrip>
              {[
                { label: "Upper", elevation: top },
                { label: "Lower", elevation: bottom },
              ].map(({ label, elevation }) => (
                <TempStat
                  key={label}
                  label={label}
                  elevation={elevation}
                  temp={tempAt(now.profile, elevation)}
                  condition={conditionAt(elevation, now.freezingLevel, sky)}
                />
              ))}
              {snow && <SnowStat snow={snow} />}
            </StatStrip>
            <p className="mt-3 text-sm tabular-nums text-muted">
              Ridgetop wind {ridge?.speed} km/h {ridge && compass(ridge.dir)}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Weather data is unavailable. It will retry on the next refresh.
          </p>
        )}
        <CardMore />
      </section>
    </Link>
  );
}
