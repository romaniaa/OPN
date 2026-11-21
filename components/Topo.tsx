import { MOUNTAINS } from "@/config/mountains";
import { PASSES, drift, seeded } from "@/lib/Sketch";

const LEVELS = 9;
const STEPS = 96;
const MAX_RADIUS = 175;

// The true contour's radius at angle a: a circle wobbled by a few sine waves.
// Lines around the same summit share a seed and only differ in radius, so they
// never cross.
function radiusAt(a: number, radius: number, seed: number) {
  return (
    radius *
    (1 +
      0.16 * Math.sin(3 * a + seed) +
      0.08 * Math.sin(5 * a + seed * 2) +
      0.04 * Math.sin(9 * a + seed * 3))
  );
}

// One pass of a contour drawn by hand (lib/Sketch.ts): it starts at a random
// point, drifts in and out of the true line by up to `amp`, and runs a little
// short of closing or a little past where it began.
function sketchContour(
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  rand: () => number,
  amp: number
) {
  const start = rand() * Math.PI * 2;
  const sweep = Math.PI * 2 * (1 + (rand() * 2 - 1) * 0.035);
  // Small rings drift less, or they turn to scribble.
  const wander = drift(rand, STEPS + 1, amp * Math.min(1, Math.max(0.3, radius / 90)));
  const points = wander.map((d, i) => {
    const a = start + (sweep * i) / STEPS;
    const r = radiusAt(a, radius, seed) + d;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a) * 0.8).toFixed(1)}`;
  });
  return `M${points.join("L")}`;
}

// Only the first few hills fit across the 1,500-unit-wide map; the rest would be
// drawn off its right edge, so they're left out.
const SUMMITS = MOUNTAINS.slice(0, 4);

// Decorative contour map behind the page, with one summit per mountain from west
// to east, sketched by hand.
export default function Topo() {
  return (
    <svg
      viewBox="0 0 1500 560"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] w-full [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
      aria-hidden="true"
    >
      {SUMMITS.map((m, i) => {
        const rand = seeded(`topo-${m.id}`);
        return (
          <g key={m.id} fill="none" stroke={m.color} strokeLinecap="round">
            {Array.from({ length: LEVELS }, (_, level) =>
              PASSES.map((pass, p) => (
                <path
                  key={`${level}-${p}`}
                  strokeOpacity={0.16 * pass.opacity}
                  d={sketchContour(
                    300 + i * 450,
                    170 + (i % 2) * 70,
                    (MAX_RADIUS * (level + 1)) / LEVELS,
                    i * 2.1 + 0.7,
                    rand,
                    pass.amp * 2.2
                  )}
                />
              ))
            )}
          </g>
        );
      })}
    </svg>
  );
}
