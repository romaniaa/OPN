// How numbers, directions and dates read across the site. Pure, with no server
// imports, so cards rendered in the browser can use them too.

// A whole number with thousands separators: 1,630.
export const fmt = (n: number) => n.toLocaleString("en-CA");

// To one decimal place, for temperatures: -3.4.
export const round1 = (n: number) => Math.round(n * 10) / 10;

// A precipitation rate, or "None" when nothing is falling.
export const precipRate = (mmPerHour: number) => (mmPerHour > 0 ? `${mmPerHour} mm/h` : "None");

const POINTS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];
export const COMPASS_POINTS = POINTS;

// A direction in degrees as one of 16 compass points.
export const compass = (deg: number) => POINTS[Math.round(deg / 22.5) % 16];

// The weekday of a YYYY-MM-DD, read as a calendar date (no time zone shift).
export const weekday = (date: string, style: "short" | "long" = "short") =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { timeZone: "UTC", weekday: style });
