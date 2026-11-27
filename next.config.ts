import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  allowedDevOrigins: ["opn.test"],
  redirects() {
    return [
      // openpeaks.ca is the one canonical host. The old North Shore Peaks
      // domain, .site and the www hosts all point at this project, so send
      // them there, keeping the path and query. Next wraps host values in
      // ^…$; the outer group keeps that anchor around every alternative, so
      // this never matches openpeaks.ca, localhost or preview URLs.
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(www\\.openpeaks\\.ca|(www\\.)?openpeaks\\.site|(www\\.)?northshorepeaks\\.com)",
          },
        ],
        destination: "https://openpeaks.ca/:path*",
        permanent: true,
      },
      // The North Shore backcountry zone is now named for Mt. Strachan.
      {
        source: "/backcountry/north-shore-backcountry",
        destination: "/backcountry/strachan",
        permanent: true,
      },
      // My hills moved from /dashboard to the home page. Share links keep their
      // #hash, since browsers carry it across a redirect.
      { source: "/dashboard", destination: "/", permanent: true },
    ];
  },
  experimental: {
    agentUpgrade: "security",
    // Prerender every page in one worker. Each worker has its own cache, so with
    // the default (a worker per 25 pages) each one fetched the weather snapshot,
    // every station and every resort page at the same moment, and Open-Meteo
    // refused the overlap with 429s. Vercel's build machine already ran a single
    // worker; this makes local builds match it.
    staticGenerationMinPagesPerWorker: 1000,
  },
};

export default nextConfig;
