import Script from "next/script";

// Cloudflare Web Analytics: aggregate, cookieless page-view counts (see the
// privacy page). The beacon strips anything after ? or # from the page address
// and the referrer before sending (checked in beacon.min.js 2026.10.1), so a
// shared My hills link, which carries the visitor's picks after the #, never
// leaves the browser. Set the site token only on production, so local builds and
// Railway PR environments aren't counted. In the Cloudflare dashboard pick the
// manual (JS snippet) setup, not automatic injection, or views count twice.
const TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

export default function SiteAnalytics() {
  if (!TOKEN) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: TOKEN })}
      strategy="afterInteractive"
    />
  );
}
