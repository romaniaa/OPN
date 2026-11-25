import Link from "next/link";
import type { ReactNode } from "react";
import PlaceIcon from "@/components/PlaceIcon";
import { NAV_FORWARD } from "@/components/Transitions";
import { weekday } from "@/lib/Format";
import type { Place, PlaceId } from "@/lib/Place";
import { SNOW_ALERT_CM, SNOW_ALERT_DAYS, type SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";

// The snowfall alert on cards and as banners; what sets one off is in lib/SnowAlert.ts.

// When a forecast day is: "today", "tomorrow", else its weekday, short ("Tue")
// or long ("on Tuesday").
function when({ date, offset }: { date: string; offset: number }, long = false) {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  const day = weekday(date, long ? "long" : "short");
  return long ? `on ${day}` : day;
}

// The alert in a few words: "32 cm new", or "25 cm Tue" for a forecast. Snow
// that has fallen comes first; the forecast is shown only without it.
function short({ fallen, forecast }: SnowAlert) {
  return fallen != null ? `${fallen} cm new` : `${forecast!.cm} cm ${when(forecast!)}`;
}

// The same in full, for screen readers.
function describe({ fallen, forecast }: SnowAlert) {
  return [
    fallen != null && `${fallen} cm of new snow in the last 24 hours`,
    forecast && `${forecast.cm} cm of snow forecast ${when(forecast, true)}`,
  ]
    .filter(Boolean)
    .join("; ");
}

function Snowflake({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v20M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
      <path d="m9 4 3 3 3-3M9 20l3-3 3 3M3.5 11l4 1-1.5 3.9M20.5 13l-4-1 1.5-3.9M3.5 13l4-1-1.5-3.9M20.5 11l-4 1 1.5 3.9" />
    </svg>
  );
}

// The alert on a hill's or zone's card, beside its name. Nothing when there's none.
export function SnowAlertChip({ alert }: { alert: SnowAlert | null | undefined }) {
  if (!alert) return null;
  return (
    <span className="chip bg-warm/15 text-warm">
      <Snowflake />
      <span aria-hidden="true">{short(alert)}</span>
      <span className="sr-only">Snowfall alert: {describe(alert)}</span>
    </span>
  );
}

const AlertHeading = () => (
  <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-warm">
    Snowfall alert
  </h2>
);

// The banner's frame: a red rule down the left, like the chips.
function Banner({ children }: { children: ReactNode }) {
  return (
    <section
      role="status"
      className="flex items-start gap-3 border border-line border-l-4 border-l-warm bg-warm/10 p-4"
    >
      <Snowflake className="mt-0.5 h-5 w-5 shrink-0 text-warm" />
      <div className="min-w-0">
        <AlertHeading />
        <div className="mt-1 space-y-1 text-ink-2">{children}</div>
      </div>
    </section>
  );
}

// The bar version, for the top of a hill's page: full width, right under the
// nav, and sticky, so it stays in view as the page scrolls. It's opaque (the
// page colour tinted red) so content doesn't show through as it passes under.
function Bar({ children }: { children: ReactNode }) {
  return (
    <section
      role="status"
      className="sticky top-0 z-30 border-b border-warm/30 bg-[color-mix(in_srgb,var(--warm)_12%,var(--page))] px-4 md:px-10"
    >
      <div className="mx-auto flex max-w-8xl items-start gap-3 py-3">
        <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
          <AlertHeading />
          <div className="space-y-0.5 text-ink-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

const Cm = ({ cm }: { cm: number }) => (
  <span className="font-semibold tabular-nums text-ink">{cm} cm</span>
);

// The banner at the top of a hill's or zone's page: a boxed banner, or with
// `bar` the full-width sticky bar. Nothing when there's no alert.
export function PlaceSnowAlert({
  name,
  snow,
  alert,
  bar = false,
}: {
  name: string;
  snow: SnowNow | undefined;
  alert: SnowAlert | null;
  bar?: boolean;
}) {
  if (!alert) return null;
  const { fallen, forecast } = alert;
  const Frame = bar ? Bar : Banner;
  return (
    <Frame>
      {fallen != null && snow && (
        <p>
          <Cm cm={fallen} /> of new snow at {name} in the last 24 hours,{" "}
          {snow.source === "report"
            ? "from the resort's snow report"
            : `from the snow sensor at ${snow.where}`}
          .
        </p>
      )}
      {forecast && (
        <p>
          <Cm cm={forecast.cm} /> of snow forecast at the top {when(forecast, true)}. A model
          estimate; see the forecast below.
        </p>
      )}
    </Frame>
  );
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Snow that has fallen first (most first), then forecasts (soonest, then biggest).
function byUrgency(a: SnowAlert, b: SnowAlert) {
  if ((a.fallen != null) !== (b.fallen != null)) return a.fallen != null ? -1 : 1;
  if (a.fallen != null && b.fallen != null) return b.fallen - a.fallen;
  return a.forecast!.offset - b.forecast!.offset || b.forecast!.cm - a.forecast!.cm;
}

// The banner on a list page, naming every hill and zone with an alert. Nothing
// when none has one.
export function SnowAlertBanner({
  places,
  alerts,
}: {
  places: Place[];
  alerts: Partial<Record<PlaceId, SnowAlert>>;
}) {
  const items = places
    .flatMap((place) => {
      const alert = alerts[place.id];
      return alert ? [{ place, alert }] : [];
    })
    .sort((a, b) => byUrgency(a.alert, b.alert));
  if (items.length === 0) return null;

  const hills = items.filter((i) => i.place.kind === "hill").length;
  const zones = items.length - hills;
  const subject = [
    hills > 0 && count(hills, "hill", "hills"),
    zones > 0 && count(zones, "backcountry zone", "backcountry zones"),
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <Banner>
      <p>
        {subject} {items.length === 1 ? "has" : "have"} more than {SNOW_ALERT_CM} cm of snow
        in a day, fallen in the last 24 hours or forecast in the next {SNOW_ALERT_DAYS} days.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map(({ place, alert }) => (
          <li key={place.id}>
            <Link
              href={place.href}
              transitionTypes={NAV_FORWARD}
              className="flex items-center gap-1.5 text-ink hover:underline"
            >
              <PlaceIcon place={place} className="h-3 w-4" />
              {place.fullName}
              {place.kind === "zone" && " backcountry"}
              <span aria-hidden="true" className="font-semibold tabular-nums text-warm">
                {alert.fallen != null ? "+" : ""}
                {short(alert)}
              </span>
              <span className="sr-only">: {describe(alert)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Banner>
  );
}
