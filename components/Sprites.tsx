"use client";

import { LogoSymbol } from "@/components/LogoArt";
import { TREE_ID, TREE_VIEWBOX } from "@/lib/Sketch";

// Drawings used many times over a page, defined once here as symbols and drawn
// with <use>, so their path data is sent once rather than at every use. The
// layout puts this at the top of every page. A client component, so the path
// data travels in a script every page shares (and the browser caches) rather
// than in each page's server payload.

// Line-drawn tree for the elevation diagrams: a trunk with four pairs of
// sweeping branches.
const TREE =
  "M36.1,88.6c0-.5.7-.8,1-.4,3.8,4.7,9.1,8,15.8,9.8,4.6,1.2,8.9,1.5,11.5,1.5s2.5,0,2.6,0c1,0,1.7-1,1.6-1.9s-1-1.7-1.9-1.6c0,0-6.1.5-12.9-1.3-8.8-2.4-14.7-7.5-17.7-15.2v-19.1c0-.7.8-.9,1.2-.5,7.8,8.7,20.3,9.4,23.8,9.4s1,0,1,0c1,0,1.7-.9,1.7-1.9,0-1-.9-1.7-1.9-1.7-.2,0-19.9,1.1-25.8-14.5v-15.3c0-1.2,1.4-1.8,2.3-1,7.1,6.2,17,6.4,17.9,6.4h0c1,0,1.8-.8,1.8-1.8,0-1-.8-1.8-1.8-1.8h0c-.3,0-15.6-.1-20.2-12.2v-15.5c0-.7.8-1,1.3-.6,5.3,4.6,12.2,5.4,12.6,5.4,0,0,.1,0,.2,0,.9,0,1.7-.7,1.8-1.6.1-1-.6-1.9-1.6-2-.1,0-11.2-1.3-14.4-10,0,0,0,0,0,0,0,0,0,0,0,0,0-.1-.1-.2-.2-.3,0,0,0-.2-.2-.2,0,0,0,0,0,0,0,0-.2-.1-.2-.2,0,0-.2-.1-.3-.2,0,0,0,0,0,0,0,0,0,0,0,0,0,0-.2,0-.2,0-.1,0-.2,0-.3,0,0,0,0,0,0,0s0,0,0,0c-.1,0-.2,0-.3,0,0,0-.2,0-.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0-.2.1-.2.2,0,0,0,0,0,0,0,0-.2,0-.2.2,0,0,0,0,0,0,0,0-.1.2-.2.2,0,0,0,0,0,0,0,0-.1.2-.2.3,0,0,0,0,0,0,0,0,0,0,0,0-3.2,8.7-14.2,10-14.4,10-1,.1-1.7,1-1.6,2,0,.9.9,1.6,1.8,1.6s.1,0,.2,0c.4,0,7.3-.8,12.6-5.4s1.3-.1,1.3.6v15.5c-4.7,12.1-20,12.2-20.2,12.2h0c-1.2,0-2.1,1.2-1.7,2.5s.9,1.1,1.7,1.1h0c.9,0,10.7-.2,17.9-6.4s2.3-.2,2.3,1v15.3c-5.9,15.5-25,14.6-25.8,14.5-1,0-1.8.7-1.9,1.7,0,1,.7,1.8,1.7,1.9,0,0,.4,0,1,0,3.6,0,16-.7,23.8-9.4s1.2-.2,1.2.5v19.1c-2.9,7.7-8.8,12.8-17.7,15.2-6.8,1.9-12.9,1.3-12.9,1.3-1,0-1.9.6-1.9,1.6s.6,1.9,1.6,1.9c.1,0,1.1,0,2.6,0,2.6,0,6.8-.2,11.5-1.5,6.8-1.8,12.2-5.2,15.9-10s.9-.1.9.3v27.2c0,.8.6,1.4,1.4,1.4h.7c.8,0,1.4-.6,1.4-1.4v-27Z";

export default function Sprites() {
  return (
    <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
      <LogoSymbol />
      {/* The drawing's lines are fine, so at the small sizes it's drawn a
          hairline stroke in the same colour keeps them from fading out. Fill
          and stroke come from each use. */}
      <symbol id={TREE_ID} viewBox={TREE_VIEWBOX}>
        <path d={TREE} strokeWidth="0.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </symbol>
    </svg>
  );
}
