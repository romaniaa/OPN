import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import PinButton from "@/components/PinButton";
import { NAV_FORWARD } from "@/components/Transitions";
import type { Place } from "@/lib/Place";

// A whole card that links to a place's page, outlined in the place's colour on
// hover. It's the `group` that the card's "Full report" footer (CardMore) reads.
export function CardLink({
  place,
  className = "",
  children,
}: {
  place: Pick<Place, "href" | "color">;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={place.href}
      transitionTypes={NAV_FORWARD}
      className={`group block flex-1 transition-shadow hover:shadow-[0_0_0_2px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 ${className}`}
      style={{ "--accent": place.color } as CSSProperties}
    >
      {children}
    </Link>
  );
}

// A place's card in a grid: the card, linking to its page, with the button to
// add it to My hills underneath.
export function PinnedCard({ place, children }: { place: Place; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <CardLink place={place}>{children}</CardLink>
      <PinButton id={place.id} name={place.fullName} color={place.color} />
    </div>
  );
}
