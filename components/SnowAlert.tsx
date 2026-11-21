import Link from "next/link";
import type { ReactNode } from "react";
import MountainIcon from "@/components/MountainIcon";
import RangeIcon from "@/components/RangeIcon";
import { NAV_FORWARD } from "@/components/Transitions";
import type { MountainConfig } from "@/config/mountains";
import type { ZoneConfig } from "@/config/zones";
import { SNOW_ALERT_CM, SNOW_ALERT_DAYS, type SnowAlert } from "@/lib/SnowAlert";
import type { SnowNow } from "@/lib/SnowNow";

// The snowfall alert on cards and as banners; what sets one off is in lib/SnowAlert.ts.

// When a forecast day is: "today", "tomorrow", else its weekday, short ("Tue")
// or long ("on Tuesday").
function when({ date, offset }: { date: string; offset: number }, long = false) {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    weekday: long ? "long" : "short",
  });
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

// The banner's frame: a red rule down the left, like the chips.
function Banner({ children }: { children: ReactNode }) {
  return (
    <section
      role="status"
      className="plate flex items-start gap-3 border border-line border-l-4 border-l-warm bg-warm/10 p-4"
    >
      <Snowflake className="mt-0.5 h-5 w-5 shrink-0 text-warm" />
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-warm">
          Snowfall alert
        </h2>
        <div className="mt-1 space-y-1 text-ink-2">{children}</div>
      </div>
    </section>
  );
}

const Cm = ({ cm }: { cm: number }) => (
  <span className="font-semibold tabular-nums text-ink">{cm} cm</span>
);

// The banner at the top of a hill's or zone's page. Nothing when there's no alert.
export function PlaceSnowAlert({
  name,
  snow,
  alert,
}: {
  name: string;
  snow: SnowNow | undefined;
  alert: SnowAlert | null;
}) {
  if (!alert) return null;
  const { fallen, forecast } = alert;
  return (
    <Banner>
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
    </Banner>
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
  hills = [],
  zones = [],
}: {
  hills?: { config: MountainConfig; alert: SnowAlert | null | undefined }[];
  zones?: { config: ZoneConfig; alert: SnowAlert | null | undefined }[];
}) {
  const alerting = <T,>(places: { config: T; alert: SnowAlert | null | undefined }[]) =>
    places.flatMap(({ config, alert }) => (alert ? [{ config, alert }] : []));
  const hillAlerts = alerting(hills);
  const zoneAlerts = alerting(zones);
  const total = hillAlerts.length + zoneAlerts.length;
  if (total === 0) return null;

  const subject = [
    hillAlerts.length > 0 && count(hillAlerts.length, "hill", "hills"),
    zoneAlerts.length > 0 && count(zoneAlerts.length, "backcountry zone", "backcountry zones"),
  ]
    .filter(Boolean)
    .join(" and ");
  const items = [
    ...hillAlerts.map(({ config, alert }) => ({
      id: config.id,
      href: `/${config.id}`,
      name: config.fullName,
      icon: <MountainIcon id={config.id} color={config.color} className="h-3 w-4" />,
      alert,
    })),
    ...zoneAlerts.map(({ config, alert }) => ({
      id: config.id,
      href: `/backcountry/${config.id}`,
      name: `${config.fullName} backcountry`,
      icon: <RangeIcon color={config.color} className="h-3 w-4" />,
      alert,
    })),
  ].sort((a, b) => byUrgency(a.alert, b.alert));

  return (
    <Banner>
      <p>
        {subject} {total === 1 ? "has" : "have"} more than {SNOW_ALERT_CM} cm of snow in a
        day, fallen in the last 24 hours or forecast in the next {SNOW_ALERT_DAYS} days.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map(({ id, href, name, icon, alert }) => (
          <li key={id}>
            <Link
              href={href}
              transitionTypes={NAV_FORWARD}
              className="flex items-center gap-1.5 text-ink hover:underline"
            >
              {icon}
              {name}
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
