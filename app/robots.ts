import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/Site";

export default function robots(): MetadataRoute.Robots {
  // Keep Railway PR environments out of search results; only production is
  // indexed. Outside Railway (local builds) the variable is unset.
  const env = process.env.RAILWAY_ENVIRONMENT_NAME;
  const isPreview = env != null && env !== "production";

  return isPreview
    ? { rules: { userAgent: "*", disallow: "/" } }
    : {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${SITE_URL}/sitemap.xml`,
      };
}
