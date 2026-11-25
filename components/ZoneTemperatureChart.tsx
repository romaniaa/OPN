import BubbleChart, { niceDomain } from "@/components/BubbleChart";
import { Card, CardTitle } from "@/components/Ui";
import type { ZoneConfig } from "@/config/zones";
import { fmt, round1 } from "@/lib/Format";
import { tempAt } from "@/lib/Model";
import type { HillNow } from "@/lib/Weather";

const STEP = 200; // metres between rows

// Temperature every 200 m across a zone's terrain, highest first, from the
// model's air temperature at each height, so inversions show up as warmer air
// above colder.
export default function ZoneTemperatureChart({ zone, now }: { zone: ZoneConfig; now: HillNow }) {
  const { top, bottom } = zone;
  const heights: number[] = [];
  for (let h = top; h >= bottom; h -= STEP) heights.push(h);
  if (heights[heights.length - 1] !== bottom) heights.push(bottom);

  const rows = heights.map((h) => {
    const t = round1(tempAt(now.profile, h));
    return { label: `${fmt(h)} m`, value: t, display: `${t}°`, color: zone.color };
  });
  const { min, max, step } = niceDomain(
    rows.map((r) => r.value),
    true
  );

  return (
    <Card>
      <CardTitle note={`Model estimates every ${STEP} m across this terrain, highest first`} className="mb-5">
        Temperature by height
      </CardTitle>
      <BubbleChart rows={rows} min={min} max={max} step={step} axisLabel="Temperature (°C)" zeroLine />
    </Card>
  );
}
