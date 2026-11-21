import CardMore from "@/components/CardMore";
import { SnowStat, StatStrip, TempStat } from "@/components/CardStats";
import { SnowAlertChip } from "@/components/SnowAlert";
import type { Landmark, MountainConfig } from "@/config/mountains";
import { PASSES, roundCorners, seeded, sketchPolyline, yAt } from "@/lib/Sketch";
import type { SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";
import type { MountainWeather } from "@/lib/PlaceWeather";
import {
  CONDITION,
  PRECIP,
  SNOW_LINE_OFFSET,
  extremes,
  fmt,
  conditionAt,
  verdict,
  vertical,
  type Sky,
} from "@/lib/Conditions";

// How far back from each corner the ridge lines start to round, in % of the
// diagram.
const CORNER = 4;

// A profile ([x %, elevation m]) as a rounded line in the diagram: [x %, height %
// from the bottom].
const rounded = (pts: [number, number][], pct: (m: number) => number) =>
  roundCorners(
    pts.map(([x, e]): [number, number] => [x, pct(e)]),
    CORNER
  );

// Simple line-art ridge. Heights match the real elevations, so the peaks sit at
// the right level; corners are rounded a little. The ridge itself is drawn
// crisp; the fainter ridge behind and the contour strata below it are sketched
// by hand (lib/Sketch.ts).
function Ridge({
  id,
  profile,
  ridge,
  pct,
  color,
}: {
  id: string;
  profile: [number, number][];
  ridge: [number, number][]; // the profile, rounded, as [x %, height %]
  pct: (m: number) => number;
  color: string;
}) {
  // Heights count up from the bottom; SVG y counts down from the top.
  const flip = (pts: [number, number][]) => pts.map(([x, h]): [number, number] => [x, 100 - h]);
  const line = (pts: [number, number][]) =>
    flip(pts).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");
  const rand = seeded(`${id}-ridge`);
  // One line as its sketched passes. The diagram is about 4 px to a unit.
  const sketched = (pts: [number, number][], opacity: number, key: string) =>
    PASSES.map((pass, i) => (
      <path
        key={`${key}-${i}`}
        d={sketchPolyline(flip(rounded(pts, pct)), rand, { amp: pass.amp * 0.9 })}
        fill="none"
        stroke={color}
        strokeOpacity={opacity * pass.opacity}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    ));

  // A fainter ridge behind, shifted and lowered, for depth.
  const back: [number, number][] = profile.map(([x, e]) => [
    Math.min(100, Math.max(0, 100 - x * 0.9 - 4)),
    e - 90,
  ]);
  back.sort((a, b) => a[0] - b[0]);

  // Fading echoes below the ridge line, drawn like contour strata.
  const span = profile.reduce((hi, [, e]) => Math.max(hi, e), 0) -
    profile.reduce((lo, [, e]) => Math.min(lo, e), Infinity);
  const strata = [1, 2, 3, 4].map((k) =>
    profile.map(([x, e]): [number, number] => [x, e - (k * span) / 7])
  );

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {sketched(back, 0.3, "back")}
      <path
        d={`${line(ridge)}L100 100L0 100Z`}
        className="fill-scene-ground"
        stroke={color}
        strokeOpacity="0.9"
        strokeWidth="1.25"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {strata.map((pts, k) => sketched(pts, 0.28 - k * 0.05, `strata-${k}`))}
    </svg>
  );
}

interface Tree {
  x: number; // % from the left
  y: number; // % from the bottom, where the trunk meets the ground
  size: number; // px tall
  opacity: number;
}

// Upper bounds per card; fewer may fit once the spacing check skips crowded spots.
const RIDGE_TREES = 5;
const SLOPE_TREES = 8;

// Trees on the ridge line, plus a scatter down the slope below it. Lower trees
// are nearer the viewer, so they're drawn larger and stronger. Trees too close
// to one already placed are skipped so the scatter doesn't clump.
function placeTrees(key: string, ridge: [number, number][]): Tree[] {
  const rand = seeded(key);
  const trees: Tree[] = [];
  const clear = (x: number, y: number) =>
    trees.every((t) => Math.abs(t.x - x) > 5 || Math.abs(t.y - y) > 8);

  // Along the ridge, keeping clear of the elevation ticks on the left edge.
  for (let i = 0; i < 40 && trees.length < RIDGE_TREES; i++) {
    const x = 6 + rand() * 91;
    const y = yAt(ridge, x);
    if (clear(x, y)) trees.push({ x, y, size: 18 + rand() * 6, opacity: 0.8 });
  }

  // Down the slope: depth runs from just under the ridge (0) to the foot of the card (1).
  const ridgeCount = trees.length;
  for (let i = 0; i < 200 && trees.length < ridgeCount + SLOPE_TREES; i++) {
    const x = 6 + rand() * 91;
    const depth = 0.12 + rand() * 0.8;
    const y = yAt(ridge, x) * (1 - depth);
    if (y < 3 || !clear(x, y)) continue;
    trees.push({
      x,
      y,
      size: 18 + depth * 18 + rand() * 4,
      opacity: 0.45 + depth * 0.4,
    });
  }
  return trees;
}

// Line-drawn spruce: three stacked tiers in one outline, each wider than the one
// above, on a short trunk. Built on a 20 x 32 grid.
const SPRUCE = "M10 2L5 11H7.5L3 20H6L1.5 28H18.5L14 20H17L12.5 11H15ZM10 28V31";

// Drawn as its own small SVG so it keeps its shape while the ridge beneath it
// stretches to fit the card.
function Spruce({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 20 32"
      width={size * (20 / 32)}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={SPRUCE} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Trees({
  id,
  ridge,
  color,
}: {
  id: string;
  ridge: [number, number][]; // the rounded ridge line, [x %, height %]
  color: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {placeTrees(id, ridge).map((t, i) => (
        <div
          key={i}
          className="absolute flex -translate-x-1/2 translate-y-[1px]"
          style={{ left: `${t.x}%`, bottom: `${t.y}%`, opacity: t.opacity }}
        >
          <Spruce size={Math.round(t.size)} color={color} />
        </div>
      ))}
    </div>
  );
}

// The elevation diagram on its own: rain, wet snow and snow bands, the ridge,
// trees, the freezing level, altimeter ticks and labelled heights. Used for hills
// (with their real ridge) and backcountry zones (with a generic one).
export function ElevationDiagram({
  id,
  name,
  min,
  max,
  profile,
  landmarks,
  color,
  freezingLevel: fl,
  sky,
}: {
  id: string;
  name: string;
  min: number;
  max: number;
  profile: [number, number][];
  landmarks: Landmark[];
  color: string;
  freezingLevel: number;
  sky: Sky;
}) {
  const pct = (m: number) => ((Math.min(max, Math.max(min, m)) - min) / (max - min)) * 100;
  const snowLine = fl - SNOW_LINE_OFFSET;
  const ridge = rounded(profile, pct);

  // Altimeter ticks every 100 m, longer at each 500 m.
  const ticks: number[] = [];
  for (let m = Math.ceil(min / 100) * 100; m <= max; m += 100) ticks.push(m);

  return (
    <>
      <div
        className="relative mt-5 h-96 overflow-hidden border border-line-2 bg-scene"
        role="img"
        aria-label={`${name} elevation diagram. Freezing level ${fl} metres.`}
      >
        <div
          className={`absolute inset-x-0 bottom-0 ${PRECIP.rain.band}`}
          style={{ height: `${pct(snowLine)}%` }}
        />
        <div
          className={`absolute inset-x-0 ${PRECIP.mixed.band}`}
          style={{
            bottom: `${pct(snowLine)}%`,
            height: `${pct(fl) - pct(snowLine)}%`,
          }}
        />
        <div
          className={`absolute inset-x-0 top-0 ${PRECIP.snow.band}`}
          style={{ height: `${100 - pct(fl)}%` }}
        />

        <Ridge id={id} profile={profile} ridge={ridge} pct={pct} color={color} />
        <Trees id={id} ridge={ridge} color={color} />

        <div
          className="absolute inset-x-0 border-t border-dashed border-scene-line/70"
          style={{ bottom: `${pct(fl)}%` }}
        />

        {ticks.map((m) => (
          <div
            key={m}
            className="absolute left-0 border-t border-scene-line/40"
            style={{ bottom: `${pct(m)}%`, width: m % 500 === 0 ? 10 : 5 }}
          />
        ))}

        {landmarks.map((l) => {
          const p = conditionAt(l.elevation, fl, sky);
          return (
            <div
              key={l.name}
              className="absolute left-4 right-2 flex -translate-y-1/2 items-center justify-between gap-2 text-xs"
              style={{ bottom: `${Math.min(91, Math.max(9, pct(l.elevation)))}%` }}
            >
              <span className="bg-scene-label/90 px-2 py-1 text-ink">
                {l.name}{" "}
                <span className="tabular-nums text-muted">
                  {l.elevation} m
                </span>
              </span>
              <span
                className={`chip ${CONDITION[p].chip}`}
              >
                {CONDITION[p].label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-faint">
        Shaded bands show what would fall at each height. Chips show what is
        happening now.
      </p>
    </>
  );
}

interface Props {
  config: MountainConfig;
  weather: MountainWeather | null;
  isTallest?: boolean;
  snow?: SnowNow; // snow on the ground, when the resort's report has it
  alert?: SnowAlert | null; // snowfall alert, fallen or forecast
  more?: boolean; // the card links to the hill's page: show the "Full report" footer
}

export default function ElevationVisualizer({
  config,
  weather,
  isTallest = false,
  snow,
  alert,
  more = false,
}: Props) {
  const { minElevation, maxElevation, landmarks, name, profile } = config;

  if (!weather) {
    return (
      <section
      className={`h-full border border-line bg-surface p-5 ${more ? "flex flex-col" : ""}`}
      style={{ borderTop: `3px solid ${config.color}` }}
    >
        <h2 className="text-lg font-semibold text-ink">{name}</h2>
        <p className="mt-3 text-sm text-muted">
          Weather data is unavailable. It will retry on the next refresh.
        </p>
        {more && <CardMore />}
      </section>
    );
  }

  const fl = weather.freezingLevel;
  const snowLine = fl - SNOW_LINE_OFFSET;
  const sky = {
    precipitation: weather.precipitation,
    cloud: weather.cloud,
    code: weather.code,
  };

  return (
    <section
      className={`h-full border border-line bg-surface p-5 ${more ? "flex flex-col" : ""}`}
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-bold text-ink">{name}</h2>
            {isTallest && (
              <span className="chip bg-ink/10 text-ink">Highest peak</span>
            )}
            <SnowAlertChip alert={alert} />
          </div>
          <p className="font-sans text-xs tabular-nums text-muted">
            {fmt(extremes(config).low)}–{fmt(extremes(config).high)} m lifts ·{" "}
            {fmt(vertical(config))} m vertical
          </p>
          <p className="mt-1 text-sm text-ink-2">{verdict(config, fl, sky)}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-bold tabular-nums text-ink">
            {fl.toLocaleString("en-CA")}
            <span className="ml-0.5 text-sm font-normal text-muted">m</span>
          </p>
          <p className="text-xs text-muted">Freezing level</p>
        </div>
      </div>

      <StatStrip>
        {(
          [
            ["Top lift", config.lifts.top.elevation, weather.temps.top],
            ["Lowest lift", config.lifts.bottom.elevation, weather.temps.bottom],
          ] as const
        ).map(([label, elevation, temp]) => (
          <TempStat
            key={label}
            label={label}
            elevation={elevation}
            temp={temp}
            condition={conditionAt(elevation, fl, sky)}
          />
        ))}
        {snow && <SnowStat snow={snow} />}
      </StatStrip>

      <ElevationDiagram
        id={config.id}
        name={name}
        min={minElevation}
        max={maxElevation}
        profile={profile}
        landmarks={landmarks}
        color={config.color}
        freezingLevel={fl}
        sky={sky}
      />

      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Precip</dt>
          <dd className="tabular-nums text-ink">
            {weather.precipitation > 0 ? `${weather.precipitation} mm/h` : "None"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Wind</dt>
          <dd className="tabular-nums text-ink">{weather.wind} km/h</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Snow line (est.)</dt>
          <dd className="tabular-nums text-ink">~{snowLine} m</dd>
        </div>
      </dl>
      {more && <CardMore />}
    </section>
  );
}