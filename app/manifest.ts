import type { MetadataRoute } from "next";
import { HOME_DESCRIPTION, SITE_NAME } from "@/lib/Site";

// The web app manifest, for "Add to Home Screen" on Android and installs from
// desktop browsers. The icons are the brand kit's navy squares (public/icon-*.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: HOME_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d10",
    theme_color: "#102a5c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
