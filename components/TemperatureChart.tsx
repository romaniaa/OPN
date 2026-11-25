import BubbleChart, { niceDomain } from "@/components/BubbleChart";
import { Card, CardTitle } from "@/components/Ui";
import type { MountainId } from "@/config/mountains";
import type { PointReading } from "@/lib/Forecast";

export default function TemperatureChart({
  readings,
}: {
  readings: PointReading[];
}) {
  const { min, max, step } = niceDomain(
    readings.map((r) => r.temp),
    true
  );

  return (
    <Card>
      <CardTitle note="Model estimates at each lift, not station readings" className="mb-5">
        Temperature by elevation
      </CardTitle>
      <BubbleChart
        rows={readings.map((r) => ({
          label: r.label,
          value: r.temp,
          display: `${r.temp}°`,
          color: r.color,
          mountain: r.id.split("-")[0] as MountainId,
        }))}
        min={min}
        max={max}
        step={step}
        axisLabel="Temperature (°C)"
        zeroLine
      />
    </Card>
  );
}