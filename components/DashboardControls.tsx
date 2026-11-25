"use client";

import { useLayoutEffect, useState } from "react";
import { Pencil } from "@/components/Icons";
import { MY_HILLS_DRAWER_ID, openMyHills, usePickerLabel } from "@/components/MyHillsDrawer";
import { useDashboard } from "@/components/useDashboard";
import { applyToDashboard } from "@/lib/Dashboard";

// The dashboard's toolbar: Pick your hills (which opens the drawer in the nav,
// components/MyHillsDrawer.tsx), the share link and the shared-view banner. The
// cards themselves are server-rendered; this only sets which show and in what
// order, through attributes on #dashboard that the CSS in lib/Dashboard.ts
// reads.
export default function DashboardControls() {
  const { hydrated, chosen, ids, shared, fromHash, save, dismissShared } = useDashboard();
  const pickerLabel = usePickerLabel();
  const [copied, setCopied] = useState(false);

  // Before paint, so a client-side navigation here never flashes every card.
  const key = ids.join(" ");
  useLayoutEffect(() => {
    const el = document.getElementById("dashboard");
    if (!el || !hydrated) return;
    applyToDashboard(el, key ? key.split(" ") : []);
  }, [hydrated, key]);

  async function copyLink() {
    const url = `${location.origin}${location.pathname}#${ids.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="mt-8 space-y-3">
      {shared && (
        <div className="flex flex-wrap items-center gap-3 border border-edge bg-surface px-4 py-3 text-sm">
          <span className="text-ink-2">Someone shared their hills with you.</span>
          <button
            type="button"
            onClick={() => save(fromHash)}
            className="orb-pill orb-pill-sm"
            data-on
          >
            Keep these as mine
          </button>
          <button type="button" onClick={dismissShared} className="orb-pill orb-pill-sm">
            Back to mine
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-controls={MY_HILLS_DRAWER_ID}
          disabled={!hydrated}
          onClick={() => {
            openMyHills();
            setCopied(false);
          }}
          className="orb-pill orb-pill-sm disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" />
          {pickerLabel}
        </button>
        {ids.length > 0 && (
          <button type="button" onClick={copyLink} className="orb-pill orb-pill-sm">
            {copied ? "Link copied!" : "Share these"}
          </button>
        )}
        <span className="text-xs text-faint">
          {hydrated &&
            (chosen || shared
              ? `${ids.length} picked · Saved on this device, so they'll be here next time.`
              : "These are the North Shore hills. Pick yours and they'll stick.")}
        </span>
      </div>

    </div>
  );
}
