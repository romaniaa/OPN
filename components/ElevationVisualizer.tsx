import CardMore from "@/components/CardMore";
import { SnowStat, StatStrip, TempStat } from "@/components/CardStats";
import MountainIcon from "@/components/MountainIcon";
import { SnowAlertChip } from "@/components/SnowAlert";
import type { Landmark, MountainConfig } from "@/config/mountains";
import { roundCorners, seeded, yAt } from "@/lib/Sketch";
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

// Contour lines below the ridge, like a topo map's: each its own line rather
// than a copy of the ridge. Further down they spread wider around the peak and
// smooth out, and each wanders on its own slow undulation, so neighbours bunch
// and spread apart. Every line stays a little below the one above it (and the
// ridge), so they never cross. Seeded per hill, so they're the same on every
// render. Heights are % from the bottom; x is % across.
const CONTOURS = 5;
const STEP = 1; // sample every 1% across

function contours(key: string, ridge: [number, number][]): [number, number][][] {
  const rand = seeded(`${key}-contours`);
  const xs = Array.from({ length: 100 / STEP + 1 }, (_, i) => i * STEP);
  const top = xs.map((x) => yAt(ridge, x));
  const high = Math.max(...top);
  const low = Math.min(...top);
  const peak = xs[top.indexOf(high)];
  const gap = Math.max(4, (high - low) / 6); // average spacing between lines

  const lines: number[][] = [];
  let above = top;
  let drop = 0;
  for (let k = 1; k <= CONTOURS; k++) {
    drop += gap * (0.75 + rand() * 0.5);
    // Spread out from the peak: sample the ridge closer in than x.
    const spread = 1 + 0.07 * k;
    const wide = xs.map((x) => yAt(ridge, peak + (x - peak) / spread));
    // Smooth more the further down: a moving average over a wider window.
    const w = 1 + 2 * k;
    const smooth = wide.map((_, i) => {
      let sum = 0;
      let n = 0;
      for (let j = Math.max(0, i - w); j <= Math.min(wide.length - 1, i + w); j++) {
        sum += wide[j];
        n++;
      }
      return sum / n;
    });
    // Its own slow wander: two waves with random length and phase.
    const waves = [0, 1].map((n) => ({
      amp: gap * (n ? 0.1 : 0.22),
      len: n ? 18 + rand() * 14 : 45 + rand() * 40,
      phase: rand() * Math.PI * 2,
    }));
    const line = smooth.map((h, i) => {
      const wander = waves.reduce(
        (sum, v) => sum + v.amp * Math.sin((xs[i] / v.len) * Math.PI * 2 + v.phase),
        0
      );
      // Never closer than about a third of a gap to the line above.
      return Math.min(h - drop + wander, above[i] - gap * 0.35);
    });
    lines.push(line);
    above = line;
  }
  return lines.map((line) => line.map((h, i): [number, number] => [xs[i], h]));
}

// Simple line-art ridge. Heights match the real elevations, so the peaks sit at
// the right level; corners are rounded a little. Behind it a fainter ridge for
// depth, and below it contour lines, all drawn as single clean lines.
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
  const line = (pts: [number, number][]) =>
    pts.map(([x, h], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${(100 - h).toFixed(2)}`).join("");
  const faint = (d: string, opacity: number, key: string) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );

  // A fainter ridge behind, shifted and lowered, for depth.
  const back: [number, number][] = profile.map(([x, e]) => [
    Math.min(100, Math.max(0, 100 - x * 0.9 - 4)),
    e - 90,
  ]);
  back.sort((a, b) => a[0] - b[0]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {faint(line(rounded(back, pct)), 0.22, "back")}
      <path
        d={`${line(ridge)}L100 100L0 100Z`}
        className="fill-scene-ground"
        stroke={color}
        strokeOpacity="0.9"
        strokeWidth="1.25"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {contours(id, ridge).map((pts, k) => faint(line(pts), 0.2 - k * 0.03, `contour-${k}`))}
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
    if (clear(x, y)) trees.push({ x, y, size: 11 + rand() * 3, opacity: 0.8 });
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
      size: 11 + depth * 8 + rand() * 2,
      opacity: 0.45 + depth * 0.4,
    });
  }
  return trees;
}

// Line-drawn tree: a trunk with four pairs of sweeping branches. The viewBox is
// cropped to the drawing, so the foot of the trunk sits on the ground line.
const TREE =
  "M36.1,88.6c0-.5.7-.8,1-.4,3.8,4.7,9.1,8,15.8,9.8,4.6,1.2,8.9,1.5,11.5,1.5s2.5,0,2.6,0c1,0,1.7-1,1.6-1.9s-1-1.7-1.9-1.6c0,0-6.1.5-12.9-1.3-8.8-2.4-14.7-7.5-17.7-15.2v-19.1c0-.7.8-.9,1.2-.5,7.8,8.7,20.3,9.4,23.8,9.4s1,0,1,0c1,0,1.7-.9,1.7-1.9,0-1-.9-1.7-1.9-1.7-.2,0-19.9,1.1-25.8-14.5v-15.3c0-1.2,1.4-1.8,2.3-1,7.1,6.2,17,6.4,17.9,6.4h0c1,0,1.8-.8,1.8-1.8,0-1-.8-1.8-1.8-1.8h0c-.3,0-15.6-.1-20.2-12.2v-15.5c0-.7.8-1,1.3-.6,5.3,4.6,12.2,5.4,12.6,5.4,0,0,.1,0,.2,0,.9,0,1.7-.7,1.8-1.6.1-1-.6-1.9-1.6-2-.1,0-11.2-1.3-14.4-10,0,0,0,0,0,0,0,0,0,0,0,0,0-.1-.1-.2-.2-.3,0,0,0-.2-.2-.2,0,0,0,0,0,0,0,0-.2-.1-.2-.2,0,0-.2-.1-.3-.2,0,0,0,0,0,0,0,0,0,0,0,0,0,0-.2,0-.2,0-.1,0-.2,0-.3,0,0,0,0,0,0,0s0,0,0,0c-.1,0-.2,0-.3,0,0,0-.2,0-.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0-.2.1-.2.2,0,0,0,0,0,0,0,0-.2,0-.2.2,0,0,0,0,0,0,0,0-.1.2-.2.2,0,0,0,0,0,0,0,0-.1.2-.2.3,0,0,0,0,0,0,0,0,0,0,0,0-3.2,8.7-14.2,10-14.4,10-1,.1-1.7,1-1.6,2,0,.9.9,1.6,1.8,1.6s.1,0,.2,0c.4,0,7.3-.8,12.6-5.4s1.3-.1,1.3.6v15.5c-4.7,12.1-20,12.2-20.2,12.2h0c-1.2,0-2.1,1.2-1.7,2.5s.9,1.1,1.7,1.1h0c.9,0,10.7-.2,17.9-6.4s2.3-.2,2.3,1v15.3c-5.9,15.5-25,14.6-25.8,14.5-1,0-1.8.7-1.9,1.7,0,1,.7,1.8,1.7,1.9,0,0,.4,0,1,0,3.6,0,16-.7,23.8-9.4s1.2-.2,1.2.5v19.1c-2.9,7.7-8.8,12.8-17.7,15.2-6.8,1.9-12.9,1.3-12.9,1.3-1,0-1.9.6-1.9,1.6s.6,1.9,1.6,1.9c.1,0,1.1,0,2.6,0,2.6,0,6.8-.2,11.5-1.5,6.8-1.8,12.2-5.2,15.9-10s.9-.1.9.3v27.2c0,.8.6,1.4,1.4,1.4h.7c.8,0,1.4-.6,1.4-1.4v-27Z";

// Drawn as its own small SVG so it keeps its shape while the ridge beneath it
// stretches to fit the card. The drawing's lines are fine, so at these small
// sizes a hairline stroke in the same colour keeps them from fading out.
function Spruce({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0.6 0.3 68.01 116.6"
      width={size * (68.01 / 116.6)}
      height={size}
      fill={color}
      stroke={color}
      strokeWidth="0.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TREE} vectorEffect="non-scaling-stroke" />
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
  snow?: SnowNow; // snow on the ground, when the resort's report has it
  alert?: SnowAlert | null; // snowfall alert, fallen or forecast
  more?: boolean; // the card links to the hill's page: show the "Full report" footer
}

export default function ElevationVisualizer({
  config,
  weather,
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
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <MountainIcon id={config.id} color={config.color} className="h-3.5 w-5" />
          {name}
        </h2>
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
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
              <MountainIcon id={config.id} color={config.color} className="h-4 w-6" />
              {name}
            </h2>
            <SnowAlertChip alert={alert} />
          </div>
          <p className="font-sans text-xs tabular-nums text-muted">
            {fmt(extremes(config).low)}–{fmt(extremes(config).high)} m lifts ·{" "}
            {fmt(vertical(config))} m vertical
          </p>
          <p className="mt-1 text-sm text-ink-2">{verdict(config, fl, sky)}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold tabular-nums text-ink">
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