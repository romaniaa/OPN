import type { ReactNode } from "react";
import ConditionChip from "@/components/ConditionChip";
import { Figure } from "@/components/Ui";
import { conditionAt, type Condition, type Sky } from "@/lib/Conditions";
import { fmt, round1 } from "@/lib/Format";
import type { SnowNow } from "@/lib/SnowNow";

// The row of headline numbers near the top of every hill and zone card: air
// temperature at the top and bottom, and snow on the ground when a source has it.
// Three columns throughout, so the numbers line up across a row of cards.
export function StatStrip({ children }: { children: ReactNode }) {
  return (
    <dl className="mt-3 grid grid-cols-3 gap-3 border-y border-line-2 py-3">{children}</dl>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <dt className="truncate text-xs text-muted">{children}</dt>
);

// Temperature at one height, with what would be falling there.
export function TempStat({
  label,
  elevation,
  temp,
  condition,
}: {
  label: string; // "Top", "Base", "Upper"…
  elevation: number; // m
  temp: number; // °C
  condition: Condition;
}) {
  return (
    <div className="min-w-0">
      <Label>
        {label} · <span className="tabular-nums">{fmt(elevation)} m</span>
      </Label>
      <Figure as="dd" value={`${round1(temp)}°`} className="leading-tight" />
      <dd className="mt-1">
        <ConditionChip condition={condition} />
      </dd>
    </div>
  );
}

// Snow on the ground, from the resort's report or a weather station.
export function SnowStat({ snow }: { snow: SnowNow }) {
  return (
    <div className="min-w-0">
      <Label>Snow · {snow.where}</Label>
      <Figure as="dd" value={fmt(snow.cm)} unit="cm" className="leading-tight" />
      <dd className="mt-1 truncate text-xs tabular-nums text-muted">
        {snow.new24 ? `+${snow.new24} cm in 24 h` : snow.source === "report" ? "Resort report" : "Station"}
      </dd>
    </div>
  );
}

export interface HeightReading {
  label: string;
  elevation: number; // m
  temp: number; // °C
}

// The strip for a place: temperature and conditions at each height (its top and
// bottom), then snow on the ground if there's a reading.
export function ConditionStrip({
  heights,
  freezingLevel,
  sky,
  snow,
}: {
  heights: HeightReading[];
  freezingLevel: number;
  sky: Sky;
  snow?: SnowNow;
}) {
  return (
    <StatStrip>
      {heights.map((h) => (
        <TempStat
          key={h.label}
          {...h}
          condition={conditionAt(h.elevation, freezingLevel, sky)}
        />
      ))}
      {snow && <SnowStat snow={snow} />}
    </StatStrip>
  );
}

// A row of small labelled readings under a card's diagram.
export function Readouts({ items }: { items: [label: string, value: ReactNode][] }) {
  return (
    <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="tabular-nums text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
