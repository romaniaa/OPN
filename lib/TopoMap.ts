import { seeded } from "@/lib/Sketch";

// The contour map behind the top of every page (components/Topo.tsx): made-up
// terrain, traced the way a real topo map is, in clean lines like the hill
// diagrams' contours.
//
// The terrain is a height field of layered noise: broad ranges with smaller
// summits, spurs and valleys on them. Contours are traced through it with
// marching squares, so they follow the terrain and never cross, then smoothed.
// As on a printed map, every fifth line is a stronger index contour, a faint
// grid runs over it all, and a couple of dashed trails wind across. It's seeded,
// so it's the same map every time.
//
// It's served as one static SVG (app/topo.svg/route.ts) rather than drawn into
// every page, since the lines come to about 100 KB.

const W = 1600;
const H = 560;
const CELL = 12; // grid spacing for tracing, in map units
const LEVELS = 30;
const GRID = 100; // the map grid's squares, in map units

type Pt = [number, number];

// Smooth seeded noise: random values on a lattice `size` units apart, blended
// with a smoothstep between them.
function noise(rand: () => number, size: number) {
  const cols = Math.ceil(W / size) + 2;
  const rows = Math.ceil(H / size) + 2;
  const lattice = Array.from({ length: rows * cols }, () => rand());
  const v = (i: number, j: number) => lattice[j * cols + i];
  const ease = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = x / size;
    const gy = y / size;
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const u = ease(gx - i);
    const w = ease(gy - j);
    const top = v(i, j) * (1 - u) + v(i + 1, j) * u;
    const bottom = v(i, j + 1) * (1 - u) + v(i + 1, j + 1) * u;
    return top * (1 - w) + bottom * w;
  };
}

// Broad ranges, then ever smaller and fainter detail on top of them.
function terrain() {
  const rand = seeded("opn-topo");
  const octaves = [
    { n: noise(rand, 420), amp: 1 },
    { n: noise(rand, 210), amp: 0.5 },
    { n: noise(rand, 105), amp: 0.25 },
    { n: noise(rand, 52), amp: 0.1 },
  ];
  return (x: number, y: number) => octaves.reduce((h, o) => h + o.amp * o.n(x, y), 0);
}

// A trail: it sets off from one edge and winds across, turning gently.
function trail(rand: () => number): Pt[] {
  let x = -20;
  let y = 80 + rand() * (H - 160);
  let heading = (rand() - 0.5) * 0.6;
  const pts: Pt[] = [[x, y]];
  while (x < W + 20) {
    heading = Math.max(-1, Math.min(1, heading * 0.9 + (rand() - 0.5) * 0.5));
    // Steer back towards the middle near the top and bottom.
    if (y < 60) heading = Math.abs(heading);
    if (y > H - 60) heading = -Math.abs(heading);
    x += 24 * Math.cos(heading);
    y += 24 * Math.sin(heading);
    pts.push([x, y]);
  }
  return pts;
}

// Marching squares: the contour at `level` as polylines, joined end to end.
// Points are keyed by the grid edge they sit on, so neighbouring cells' pieces
// join exactly.
function trace(grid: number[][], level: number): Pt[][] {
  const ny = grid.length;
  const nx = grid[0].length;
  const point = new Map<string, Pt>();
  const at = (key: string, a: number, b: number, pa: Pt, pb: Pt) => {
    if (!point.has(key)) {
      const t = (level - a) / (b - a);
      point.set(key, [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]);
    }
    return key;
  };
  const links = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    links.set(a, [...(links.get(a) ?? []), b]);
    links.set(b, [...(links.get(b) ?? []), a]);
  };

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const tl = grid[j][i];
      const tr = grid[j][i + 1];
      const br = grid[j + 1][i + 1];
      const bl = grid[j + 1][i];
      const c =
        (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const P = (ii: number, jj: number): Pt => [ii * CELL, jj * CELL];
      const top = () => at(`h${i},${j}`, tl, tr, P(i, j), P(i + 1, j));
      const bottom = () => at(`h${i},${j + 1}`, bl, br, P(i, j + 1), P(i + 1, j + 1));
      const left = () => at(`v${i},${j}`, tl, bl, P(i, j), P(i, j + 1));
      const right = () => at(`v${i + 1},${j}`, tr, br, P(i + 1, j), P(i + 1, j + 1));
      const centre = (tl + tr + br + bl) / 4 > level;
      switch (c) {
        case 1: case 14: link(left(), bottom()); break;
        case 2: case 13: link(bottom(), right()); break;
        case 3: case 12: link(left(), right()); break;
        case 4: case 11: link(top(), right()); break;
        case 6: case 9: link(top(), bottom()); break;
        case 7: case 8: link(left(), top()); break;
        // Saddles: the centre decides which corners connect.
        case 5:
          if (centre) { link(left(), top()); link(bottom(), right()); }
          else { link(left(), bottom()); link(top(), right()); }
          break;
        case 10:
          if (centre) { link(left(), bottom()); link(top(), right()); }
          else { link(left(), top()); link(bottom(), right()); }
          break;
      }
    }
  }

  // Walk the links into lines, starting from loose ends first so open lines
  // (ones that run off the map) come out whole; what's left are closed loops.
  const seen = new Set<string>();
  const lines: Pt[][] = [];
  const walk = (start: string) => {
    const keys = [start];
    seen.add(start);
    let next = links.get(start)?.find((k) => !seen.has(k));
    while (next) {
      keys.push(next);
      seen.add(next);
      next = links.get(next)?.find((k) => !seen.has(k));
    }
    const closed = keys.length > 2 && links.get(keys[keys.length - 1])?.includes(start);
    const pts = keys.map((k) => point.get(k)!);
    lines.push(closed ? [...pts, pts[0]] : pts);
  };
  for (const [k, l] of links) if (l.length === 1 && !seen.has(k)) walk(k);
  for (const k of links.keys()) if (!seen.has(k)) walk(k);
  return lines.filter((l) => l.length > 3);
}

// Chaikin smoothing: rounds off the grid's corners, keeping open ends in place.
function smooth(pts: Pt[], rounds = 2): Pt[] {
  let out = pts;
  for (let r = 0; r < rounds; r++) {
    const closed = out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1];
    const next: Pt[] = closed ? [] : [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const [a, b] = [out[i], out[i + 1]];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (closed) next.push(next[0]);
    else next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

const path = (pts: Pt[]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${Math.round(x)} ${Math.round(y)}`).join("");

// Both kinds of contour as one path each.
function contours() {
  const height = terrain();
  const grid = Array.from({ length: H / CELL + 1 }, (_, j) =>
    Array.from({ length: W / CELL + 1 }, (_, i) => height(i * CELL, j * CELL))
  );
  const values = grid.flat();
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const lines = { contour: "", index: "" };
  for (let n = 1; n <= LEVELS; n++) {
    const level = lo + ((hi - lo) * n) / (LEVELS + 1);
    const d = trace(grid, level).map((l) => path(smooth(l))).join("");
    if (n % 5 === 0) lines.index += d;
    else lines.contour += d;
  }
  return lines;
}

// The map as an SVG file. Its lines are black at low opacity: the page uses it
// as a mask, so only their opacity matters, and the colour comes from the page.
export function topoSvg() {
  const { contour, index } = contours();
  const grid = [
    ...Array.from({ length: W / GRID - 1 }, (_, i) => `M${(i + 1) * GRID} 0V${H}`),
    ...Array.from({ length: Math.floor(H / GRID) }, (_, j) => `M0 ${(j + 1) * GRID}H${W}`),
  ].join("");
  const rand = seeded("opn-topo-trails");
  const trails = [trail(rand), trail(rand)].map((t) => path(smooth(t))).join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<g fill="none" stroke="#000" stroke-linejoin="round" stroke-linecap="round">`,
    `<path d="${grid}" stroke-opacity="0.05" stroke-width="1" stroke-linecap="butt"/>`,
    `<path d="${contour}" stroke-opacity="0.09" stroke-width="1"/>`,
    `<path d="${index}" stroke-opacity="0.17" stroke-width="1.6"/>`,
    `<path d="${trails}" stroke-opacity="0.16" stroke-width="1.2" stroke-dasharray="7 5"/>`,
    `</g></svg>`,
  ].join("");
}
