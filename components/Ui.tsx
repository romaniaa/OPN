import type { ReactNode } from "react";

// A panel. `accent` draws a rule in a place's colour along the top; `compact`
// pads it less, for cards that sit in a grid or beside another card; `plate`
// (on by default) adds the survey ticks in its corners.
export function Card({
  children,
  className = "",
  accent,
  compact = false,
  plate = true,
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
  compact?: boolean;
  plate?: boolean;
}) {
  return (
    <section
      className={`border border-line bg-surface ${plate ? "plate" : ""} ${compact ? "p-4" : "p-5"} ${className}`}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </section>
  );
}

// A card's heading, with one short line under it saying what it shows.
export function CardTitle({
  children,
  note,
  className = "",
}: {
  children: ReactNode;
  note?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="font-semibold text-ink">{children}</h3>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
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

// A headline reading in the display face, with its unit small beside it.
const FIGURE = {
  sm: ["text-2xl", "ml-0.5 text-xs"],
  md: ["text-3xl", "ml-0.5 text-sm"],
  lg: ["text-4xl", "ml-1 text-lg"],
  xl: ["text-5xl", "ml-1 text-base"],
  "2xl": ["text-6xl", "ml-1 text-2xl"],
} as const;

export function Figure({
  value,
  unit,
  size = "md",
  as: Tag = "p",
  className = "",
  children,
}: {
  value: ReactNode;
  unit?: string;
  size?: keyof typeof FIGURE;
  as?: "p" | "dd" | "span";
  className?: string;
  children?: ReactNode; // anything after the unit
}) {
  const [text, unitText] = FIGURE[size];
  return (
    <Tag className={`font-display font-bold tabular-nums text-ink ${text} ${className}`}>
      {value}
      {unit && <span className={`font-normal text-muted ${unitText}`}>{unit}</span>}
      {children}
    </Tag>
  );
}

// In place of a card whose data didn't load.
export function Unavailable({ title }: { title: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mt-2 text-sm text-muted">
        This one didn&apos;t load just now. It&apos;ll try again on the next refresh.
      </p>
    </Card>
  );
}

// In place of the weather on a hill's or zone's card.
export function NoWeather() {
  return (
    <p className="mt-3 text-sm text-muted">
      Weather data is unavailable. It will retry on the next refresh.
    </p>
  );
}

// An inline link to another site, for credits in running text.
export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="underline hover:text-ink">
      {children}
    </a>
  );
}

export const AvalancheCanada = () => (
  <SourceLink href="https://avalanche.ca">Avalanche Canada</SourceLink>
);
export const OpenMeteo = () => <SourceLink href="https://open-meteo.com">Open-Meteo.com</SourceLink>;
