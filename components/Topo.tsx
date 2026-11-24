import type { CSSProperties } from "react";

// The contour map behind the top of every page (lib/TopoMap.ts, served as
// /topo.svg). It's a mask over a block of the ink colour, so its lines follow
// the theme, and a second mask fades it into the page before the content below.
// Below 1,600 px wide the map keeps its size and is cropped from the centre;
// wider than that, it scales up to span the window.
const MASK: CSSProperties = {
  maskImage: "url(/topo.svg), linear-gradient(to bottom, black 25%, transparent 88%)",
  maskComposite: "intersect",
  maskRepeat: "no-repeat",
  maskPosition: "top center",
  maskSize: "max(100%, 1600px) auto, 100% 100%",
};

export default function Topo() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-ink"
      style={MASK}
      aria-hidden="true"
    />
  );
}
