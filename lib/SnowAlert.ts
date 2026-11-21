import type { DayForecast } from "@/lib/Daily";
import type { SnowNow } from "@/lib/SnowNow";

// A snowfall alert: more than this much snow in a day, either fallen in the last
// 24 hours (a resort's report, or a weather station's depth gain for hills
// without one and for backcountry zones) or forecast at the top for any of the
// next few days (the model's daily forecast, lib/Daily.ts). No server imports,
// so the dashboard's cards can use it in the browser.
export const SNOW_ALERT_CM = 20;
// Today and the four days after it.
export const SNOW_ALERT_DAYS = 5;

export interface SnowAlert {
  fallen: number | null; // cm in the last 24 hours, when over the line
  // The snowiest forecast day over the line: cm at the top, its date, and how
  // many days from today it is (0 = today).
  forecast: { cm: number; date: string; offset: number } | null;
}

// A place's alert, or null when it has none. `days` is its daily forecast from
// today (lib/Forecast.ts). A saved report (the resort couldn't be read just now)
// can be days old, so its 24-hour figure never counts.
export function snowAlert(
  snow: SnowNow | undefined,
  days: Pick<DayForecast, "date" | "top">[] | undefined
): SnowAlert | null {
  const new24 = snow && !snow.saved ? snow.new24 : null;
  const fallen = new24 != null && new24 > SNOW_ALERT_CM ? new24 : null;

  let forecast: SnowAlert["forecast"] = null;
  (days ?? []).slice(0, SNOW_ALERT_DAYS).forEach((d, offset) => {
    if (d.top.snow > SNOW_ALERT_CM && d.top.snow > (forecast?.cm ?? 0)) {
      forecast = { cm: d.top.snow, date: d.date, offset };
    }
  });

  return fallen == null && forecast == null ? null : { fallen, forecast };
}
