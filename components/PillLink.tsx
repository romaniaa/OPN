import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalArrow, NextArrow } from "@/components/Icons";
import { NAV_FORWARD } from "@/components/Transitions";

// A compact pill button that is a link. Filled for the main way out of a card
// (e.g. a resort's own page), raised by default, and secondary (outlined and
// quiet, with an arrow) for ways onward that shouldn't compete with the page's
// main actions. External links open in a new tab and say so to screen readers.
export default function PillLink({
  href,
  children,
  filled = false,
  secondary = false,
  className = "",
  transitionTypes = NAV_FORWARD,
}: {
  href: string;
  children: ReactNode;
  filled?: boolean;
  secondary?: boolean;
  className?: string;
  transitionTypes?: string[];
}) {
  const external = /^https?:/.test(href);
  const cls = `orb-pill orb-pill-sm whitespace-nowrap ${secondary ? "orb-pill-secondary" : ""} ${className}`;
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      data-on={filled || undefined}
    >
      {children}
      <ExternalArrow />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <Link href={href} className={cls} data-on={filled || undefined} transitionTypes={transitionTypes}>
      {children}
      {secondary && <NextArrow className="pill-arrow h-3.5 w-3.5" />}
    </Link>
  );
}
