import Link from "next/link";
import type { ReactNode } from "react";
import MountainIcon from "@/components/MountainIcon";
import { NAV_FORWARD } from "@/components/Transitions";
import type { MountainConfig } from "@/config/mountains";
import type { SnowNow } from "@/lib/SnowNow";

// A snowfall alert: more than this much new snow in a day (the 24-hour figure in
// the resort's report, or a station's 24-hour depth gain). No server imports, so
// the dashboard's cards can use it in the browser.
export const SNOW_ALERT_CM = 20;

// The day's new snow, in cm, when it is enough for an alert; else null. A saved
// report (the resort couldn't be read just now) can be days old, so it never
// counts.
export function snowAlert(snow: SnowNow | undefined): number | null {
  if (!snow || snow.saved || snow.new24 == null) return null;
  return snow.new24 > SNOW_ALERT_CM ? snow.new24 : null;
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

// The alert on a hill's card, beside its name. Nothing when there's no alert.
export function SnowAlertChip({ snow }: { snow: SnowNow | undefined }) {
  const cm = snowAlert(snow);
  if (cm == null) return null;
  return (
    <span className="chip bg-frost/15 text-frost">
      <Snowflake />
      <span className="tabular-nums">{cm} cm</span> new
      <span className="sr-only">: snowfall alert, {cm} cm of new snow in 24 hours</span>
    </span>
  );
}

// The banner's frame: a snow-blue rule down the left, like the chips.
function Banner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      role="status"
      className="plate flex items-start gap-3 border border-line border-l-4 border-l-frost bg-frost/10 p-4"
    >
      <Snowflake className="mt-0.5 h-5 w-5 shrink-0 text-frost" />
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-frost">
          {title}
        </h2>
        <div className="mt-1 text-ink-2">{children}</div>
      </div>
    </section>
  );
}

// The banner at the top of one hill's page. Nothing when there's no alert.
export function HillSnowAlert({ name, snow }: { name: string; snow: SnowNow | undefined }) {
  const cm = snowAlert(snow);
  if (cm == null || !snow) return null;
  return (
    <Banner title="Snowfall alert">
      <span className="font-semibold tabular-nums text-ink">{cm} cm</span> of new snow at {name}{" "}
      in the last 24 hours,{" "}
      {snow.source === "report"
        ? "from the resort's snow report"
        : `from the snow sensor at ${snow.where}`}
      .
    </Banner>
  );
}

// The banner on the list of hills, naming every hill with an alert. Nothing when
// none has one.
export function SnowAlertBanner({
  hills,
}: {
  hills: { config: MountainConfig; snow: SnowNow | undefined }[];
}) {
  const alerts = hills
    .flatMap(({ config, snow }) => {
      const cm = snowAlert(snow);
      return cm == null ? [] : [{ config, cm }];
    })
    .sort((a, b) => b.cm - a.cm);
  if (alerts.length === 0) return null;

  return (
    <Banner title="Snowfall alert">
      <p>
        {alerts.length === 1 ? "One hill has" : `${alerts.length} hills have`} had more than{" "}
        {SNOW_ALERT_CM} cm of new snow in the last 24 hours.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
        {alerts.map(({ config, cm }) => (
          <li key={config.id}>
            <Link
              href={`/${config.id}`}
              transitionTypes={NAV_FORWARD}
              className="flex items-center gap-1.5 text-ink hover:underline"
            >
              <MountainIcon id={config.id} color={config.color} className="h-3 w-4" />
              {config.fullName}
              <span className="font-semibold tabular-nums text-frost">+{cm} cm</span>
            </Link>
          </li>
        ))}
      </ul>
    </Banner>
  );
}
