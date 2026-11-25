import type { ReactNode } from "react";
import PlaceIcon from "@/components/PlaceIcon";
import { SnowAlertChip } from "@/components/SnowAlert";
import { Figure } from "@/components/Ui";
import { DANGER_STYLE } from "@/lib/DangerStyle";
import { todayDanger, type AvalancheForecast } from "@/lib/Danger";
import { fmt } from "@/lib/Format";
import type { SnowAlert } from "@/lib/SnowAlert";

// The top of a hill's or zone's card: its icon and name, a line or two about it,
// any snowfall alert, and the freezing level on the right. Compact for the
// lists of cards (/hills, /backcountry), large for the diagram cards.
export function PlaceCardHeader({
  place,
  name,
  alert,
  freezingLevel,
  compact = false,
  children,
}: {
  place: { kind: "hill" | "zone"; id: string; color: string };
  name: string;
  alert?: SnowAlert | null;
  freezingLevel?: number | null; // left out when the weather didn't load
  compact?: boolean;
  children: ReactNode; // the lines under the name
}) {
  const Heading = compact ? "h3" : "h2";
  const title = (
    <Heading
      className={`flex items-center gap-2 font-extrabold text-ink ${compact ? "text-lg" : "text-2xl"}`}
    >
      <PlaceIcon place={place} className={compact ? "h-3.5 w-5" : "h-4 w-6"} />
      <span className={compact ? "truncate" : undefined}>{name}</span>
    </Heading>
  );
  return (
    <div className={`flex items-start justify-between ${compact ? "gap-3" : "gap-4"}`}>
      <div className="min-w-0">
        {compact ? (
          title
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {title}
            <SnowAlertChip alert={alert} />
          </div>
        )}
        {children}
        {compact && alert && (
          <p className="mt-1.5">
            <SnowAlertChip alert={alert} />
          </p>
        )}
      </div>
      {freezingLevel != null && (
        <div className="shrink-0 text-right">
          <Figure value={fmt(freezingLevel)} unit="m" size={compact ? "sm" : "md"} />
          <p className="text-xs text-muted">Freezing level</p>
        </div>
      )}
    </div>
  );
}

// Today's highest avalanche danger as a chip in the danger scale's colours, or
// why there's no rating.
export function DangerChip({ forecast }: { forecast: AvalancheForecast | null }) {
  const level = todayDanger(forecast);
  if (level) {
    return <span className={`chip ${DANGER_STYLE[level].chip}`}>Up to {DANGER_STYLE[level].label}</span>;
  }
  return (
    <span className="chip bg-ink/10 text-ink-2">
      {forecast == null
        ? "Unavailable"
        : forecast.status === "ok"
          ? (forecast.note ?? "No rating")
          : "No current forecast"}
    </span>
  );
}
