// Drawing helpers for the decorative line art (the hill diagrams and the map
// behind the page). Seeded, so a drawing looks the same on every render, on the
// server and in the browser.

// Small seeded random generator (mulberry32). Seeding it with a key (a hill's id)
// gives each its own scatter that stays put between renders and refreshes.
export function seeded(key: string) {
  let a = [...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 7);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

// An open polyline with its corners rounded: each corner becomes a curve that
// starts up to `radius` back along both sides (half the side, on short ones, so
// neighbouring curves never overlap), sampled into points. On a line running
// left to right, x stays in order.
export function roundCorners(pts: Pt[], radius: number, samples = 6): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p1, p2] = [pts[i - 1], pts[i], pts[i + 1]];
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    if (d1 === 0 || d2 === 0) continue;
    const k1 = Math.min(radius, d1 / 2) / d1;
    const k2 = Math.min(radius, d2 / 2) / d2;
    const a: Pt = [p1[0] + (p0[0] - p1[0]) * k1, p1[1] + (p0[1] - p1[1]) * k1];
    const b: Pt = [p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2];
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const [u, v, w] = [(1 - t) ** 2, 2 * (1 - t) * t, t ** 2];
      out.push([u * a[0] + v * p1[0] + w * b[0], u * a[1] + v * p1[1] + w * b[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// The line's y at x, on a polyline running left to right.
export function yAt(pts: Pt[], x: number) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
  }
  return pts[pts.length - 1][1];
}
