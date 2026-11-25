import MountainIcon from "@/components/MountainIcon";
import RangeIcon from "@/components/RangeIcon";
import type { MountainId } from "@/config/mountains";

// A hill's own silhouette, or the generic range for a backcountry zone.
export default function PlaceIcon({
  place,
  className = "h-3.5 w-5",
}: {
  place: { kind: "hill" | "zone"; id: string; color: string };
  className?: string;
}) {
  return place.kind === "hill" ? (
    <MountainIcon id={place.id as MountainId} color={place.color} className={className} />
  ) : (
    <RangeIcon color={place.color} className={className} />
  );
}
