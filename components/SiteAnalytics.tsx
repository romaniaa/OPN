"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Vercel Web Analytics: aggregate page-view counts (see the privacy page). Only
// the page's path is sent: anything after ? or # is dropped first, since a
// shared My hills link carries the visitor's picks after the #, and the privacy
// page promises that never leaves the browser.
function pathOnly(event: BeforeSendEvent) {
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

export default function SiteAnalytics() {
  return <Analytics beforeSend={pathOnly} />;
}
