import RegionPage, { regionMetadata } from "@/components/RegionPage";

export const metadata = regionMetadata("north");

export default function Page() {
  return <RegionPage id="north" />;
}
