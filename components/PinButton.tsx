"use client";

import type { CSSProperties } from "react";
import { PillLink } from "@/components/Ui";
import { useDashboard } from "@/components/useDashboard";

// Adds a hill or zone to the visitor's dashboard, or takes it off. Large (on a
// place's own page): a round button that fills with the place's colour and shows
// a check when it's on. Small (under a card): a plain + and a label in small
// capitals, at the card's right edge, the + turning to a check in the place's
// colour when it's on. Until the page hydrates it can't know the saved state, so
// it renders off and disabled.
export default function PinButton({
  id,
  name,
  color = "#7dd3fc",
  size = "small",
}: {
  id: string;
  name: string;
  color?: string;
  size?: "small" | "large";
}) {
  const { hydrated, has, toggle } = useDashboard();
  const on = hydrated && has(id);
  const label = on ? `Remove ${name} from My hills` : `Add ${name} to My hills`;

  if (size === "small") {
    return (
      <button
        type="button"
        disabled={!hydrated}
        aria-pressed={on}
        aria-label={label}
        onClick={() => toggle(id)}
        className={`orb-trigger inline-flex items-center gap-0.5 self-end rounded py-1 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors disabled:opacity-60 cursor-pointer ${
          on ? "text-ink" : "text-muted hover:text-ink"
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke={on ? color : "currentColor"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={on ? "M3 8.5 6.5 12 13 4.5" : "M8 3v10M3 8h10"} />
        </svg>
        {on ? "On My hills" : "Add to My hills"}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={!hydrated}
        aria-pressed={on}
        aria-label={label}
        onClick={() => toggle(id)}
        className="orb-trigger inline-flex items-center gap-2.5 rounded-full pr-1 text-sm disabled:opacity-60"
      >
        <span
          className="orb"
          data-on={on || undefined}
          style={{ "--orb": color } as CSSProperties}
          aria-hidden="true"
        >
          <svg
            data-when="off"
            className="orb-icon h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          <svg
            data-when="on"
            className="orb-icon h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        </span>
        <span className={on ? "font-medium text-ink" : "text-ink-2"}>
          {on ? "On My hills" : "Add to My hills"}
        </span>
      </button>
      {on && <PillLink href="/">View My hills</PillLink>}
    </span>
  );
}
