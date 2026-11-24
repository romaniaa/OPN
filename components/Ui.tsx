import Link from "next/link";
import { NAV_FORWARD } from "@/components/Transitions";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`plate border border-line bg-surface p-5 ${className}`}>
      {children}
    </section>
  );
}

// A numbered section heading with a rule, and optionally one short line under
// it saying what the section is for. The space above is what separates sections,
// so they read as distinct blocks while the content inside stays close.
export function SectionLabel({
  children,
  note,
  numbered = true,
}: {
  children: ReactNode;
  note?: ReactNode;
  numbered?: boolean; // false leaves out the 01, 02… count
}) {
  return (
    <div className="section-head">
      <h2
        className={`${numbered ? "section-label " : ""}flex items-center gap-3 text-lg font-semibold text-ink`}
      >
        {children}
        <span className="h-px flex-1 bg-line-2" aria-hidden="true" />
      </h2>
      {note && <p className="mt-1.5 max-w-2xl text-sm text-muted">{note}</p>}
    </div>
  );
}

// The small label above a page title: where you are, in a few words.
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{children}</p>
  );
}

export function Unavailable({ title }: { title: string }) {
  return (
    <Card>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted">
        This one didn&apos;t load just now. It&apos;ll try again on the next refresh.
      </p>
    </Card>
  );
}

// The arrow on links that open another site.
export function ExternalArrow({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h7v7M13 3 3 13" />
    </svg>
  );
}

// The arrow on secondary links within the site; it nudges forward on hover.
function NextArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="pill-arrow h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// A compact pill button that is a link. Filled for the main way out of a card
// (e.g. a resort's own page), raised by default, and secondary (outlined and
// quiet, with an arrow) for ways onward that shouldn't compete with the page's
// main actions. External links open in a new tab and say so to screen readers.
export function PillLink({
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
      {secondary && <NextArrow />}
    </Link>
  );
}
