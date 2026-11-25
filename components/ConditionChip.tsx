import { CONDITION, type Condition } from "@/lib/Conditions";

// What's falling, or the sky, at a height: "Snow", "Rain", "Partly cloudy"…
export default function ConditionChip({ condition }: { condition: Condition }) {
  return <span className={`chip ${CONDITION[condition].chip}`}>{CONDITION[condition].label}</span>;
}
