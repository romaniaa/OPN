"use client";

import { useSyncExternalStore } from "react";

// The home page's headline, a different one on each visit, as [before,
// highlight, after]: the highlight is drawn in snow blue.
export const HEADLINES: [string, string, string][] = [
  ["", "Know", " before you go."],
  ["The ", "details", " you want."],
  ["Compare your ", "favourite ", "hills."],
  ["Info for your ", "next ", "trip."],
  ["Is it ", "snowing", " where you're going?"],
];

const KEY = "__opnHeadline";
const LAST = "opn:headline"; // the last one shown, so a reload never repeats it

// The page is static, so the server can't choose. On a full load this script,
// right after the heading, picks one before the first paint (never the last one
// shown), writes its three parts into the heading's three spans, and records it
// for the component below. The HTML keeps the first, for search engines and
// anyone without JavaScript.
const SCRIPT = `(function(){var h=${JSON.stringify(HEADLINES)},l=-1,i,s;try{l=+localStorage.getItem(${JSON.stringify(LAST)})}catch(e){}do{i=Math.floor(Math.random()*h.length)}while(h.length>1&&i===l);try{localStorage.setItem(${JSON.stringify(LAST)},i)}catch(e){}window.${KEY}=i;s=document.getElementById("headline").children;for(var j=0;j<3;j++)s[j].textContent=h[i][j]})()`;

// The script's pick, or, on a client-side visit where it didn't run, one chosen
// now. Either way it holds until the next full load.
function pick(): number {
  const w = window as unknown as Record<string, number | undefined>;
  if (w[KEY] === undefined) w[KEY] = Math.floor(Math.random() * HEADLINES.length);
  return w[KEY]!;
}
const subscribe = () => () => {};

export default function Headline({ className = "" }: { className?: string }) {
  // The server (and hydration) render the first; right after, the browser's
  // pick, which the script has usually already put on screen. Always three
  // spans, even when a part is empty, so the script and React agree on the shape.
  const i = useSyncExternalStore(subscribe, pick, () => 0);
  const [before, highlight, after] = HEADLINES[i];
  return (
    <>
      <h1 id="headline" className={className}>
        <span suppressHydrationWarning>{before}</span>
        <span className="text-frost" suppressHydrationWarning>
          {highlight}
        </span>
        <span suppressHydrationWarning>{after}</span>
      </h1>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
}
