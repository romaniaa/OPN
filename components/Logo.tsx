import { SITE_NAME } from "@/lib/Site";

// The OpenPeaks logo in the brand colour (--brand): black on light pages, white
// on dark ones. Set the height with className; the width follows. It draws the
// symbol the layout puts on every page (components/LogoArt.tsx).

export const LOGO_ID = "opn-logo";
export const LOGO_WIDTH = 435.17; // in a 100-high box
export const LOGO_VIEWBOX = `0 0 ${LOGO_WIDTH} 100`;

export default function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={`text-brand ${className}`} role="img" aria-label={SITE_NAME}>
      <use href={`#${LOGO_ID}`} />
    </svg>
  );
}
