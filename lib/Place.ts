import { MOUNTAINS, type MountainConfig, type MountainId } from "@/config/mountains";
import { REGIONS, type AreaId, type RegionId } from "@/config/regions";
import { ZONES, type ZoneConfig, type ZoneId } from "@/config/zones";

// Every hill and backcountry zone as one list, for everything that treats them
// alike: menus, pickers, banners, links. No server imports, so client components
// can use it.

export type PlaceId = MountainId | ZoneId;

export type Place = {
  id: PlaceId;
  name: string;
  fullName: string;
  href: string; // its page
  color: string;
  region: RegionId;
  area: AreaId;
} & ({ kind: "hill"; config: MountainConfig } | { kind: "zone"; config: ZoneConfig });

export const placeHref = (p: { kind: "hill" | "zone"; id: string }) =>
  p.kind === "hill" ? `/${p.id}` : `/backcountry/${p.id}`;

const hill = (m: MountainConfig): Place => ({
  id: m.id,
  name: m.name,
  fullName: m.fullName,
  href: `/${m.id}`,
  color: m.color,
  region: m.region,
  area: m.area,
  kind: "hill",
  config: m,
});

const zone = (z: ZoneConfig): Place => ({
  id: z.id,
  name: z.name,
  fullName: z.fullName,
  href: `/backcountry/${z.id}`,
  color: z.color,
  region: z.region,
  area: z.area,
  kind: "zone",
  config: z,
});

// Hills first, then zones, each in config order.
export const PLACES: Place[] = [...MOUNTAINS.map(hill), ...ZONES.map(zone)];

const BY_ID = new Map<string, Place>(PLACES.map((p) => [p.id, p]));
export const placeById = (id: string) => BY_ID.get(id);

// Each region's hills, then its backcountry zones; regions with none are left out.
export const PLACES_BY_REGION = REGIONS.map((region) => ({
  region,
  places: PLACES.filter((p) => p.region === region.id),
})).filter((g) => g.places.length > 0);
