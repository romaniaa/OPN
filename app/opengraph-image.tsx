import { MOUNTAINS } from "@/config/mountains";
import { OG_SIZE, ogAlt, ogImage } from "@/lib/OgImage";

export const alt = ogAlt("Ski conditions in BC and the Rockies");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    title: "Ski conditions in BC and the Rockies",
    subtitle: "26 hills and 10 backcountry zones: temperature, snow depth, rain or snow",
    mountains: MOUNTAINS.filter((m) => ["cypress", "whistler", "revelstoke"].includes(m.id)),
  });
}
