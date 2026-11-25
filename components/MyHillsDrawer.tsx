"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import MountainIcon from "@/components/MountainIcon";
import { NAV_FADE } from "@/components/Transitions";
import RangeIcon from "@/components/RangeIcon";
import { useDashboard } from "@/components/useDashboard";
import { useSheet } from "@/components/useSheet";
import { MOUNTAINS, type MountainId } from "@/config/mountains";
import { REGIONS } from "@/config/regions";
import { ZONES } from "@/config/zones";

// The id of the one drawer, for buttons' aria-controls. It's rendered once, in
// the nav, which the layout keeps mounted on every page.
export const MY_HILLS_DRAWER_ID = "my-hills-drawer";
const OPEN_EVENT = "opn:open-my-hills";

// Opens the drawer from anywhere: the nav's button, or Pick your hills on the
// home page.
export function openMyHills() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

// What the picker is called: "Pick your hills" until the visitor has saved a
// pick of their own, then "Edit Your Hills". Before hydration the saved pick
// isn't known yet, so it starts as "Pick your hills".
export function usePickerLabel() {
  const { chosen, saved } = useDashboard();
  return chosen && saved.length > 0 ? "Edit Your Hills" : "Pick your hills";
}

export interface PickerGroup {
  region: string;
  places: { id: string; name: string; color: string; kind: "Resort" | "Backcountry" }[];
}

// Each region's hills, then its backcountry zones.
const GROUPS: PickerGroup[] = REGIONS.map((r) => ({
  region: r.name,
  places: [
    ...MOUNTAINS.filter((m) => m.region === r.id).map((m) => ({
      id: m.id,
      name: m.fullName,
      color: m.color,
      kind: "Resort" as const,
    })),
    ...ZONES.filter((z) => z.region === r.id).map((z) => ({
      id: z.id,
      name: z.fullName,
      color: z.color,
      kind: "Backcountry" as const,
    })),
  ],
})).filter((g) => g.places.length > 0);

type Place = PickerGroup["places"][number];

function PlaceIcon({ place }: { place: Place }) {
  return place.kind === "Backcountry" ? (
    <RangeIcon color={place.color} className="h-3.5 w-5 shrink-0" />
  ) : (
    <MountainIcon id={place.id as MountainId} color={place.color} className="h-3.5 w-5 shrink-0" />
  );
}

// A small round button in the "Your hills" list.
function RowButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="orb orb-sm"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={danger ? ({ "--orb": "#f87171" } as CSSProperties) : undefined}
    >
      {children}
    </button>
  );
}

// The drag handle's mark: two columns of three dots.
const Grip = () => (
  <svg viewBox="0 0 10 16" className="h-4 w-2.5" fill="currentColor" aria-hidden="true">
    {[3, 8, 13].map((y) => (
      <g key={y}>
        <circle cx="2.5" cy={y} r="1.5" />
        <circle cx="7.5" cy={y} r="1.5" />
      </g>
    ))}
  </svg>
);

const Cross = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

// A drag in progress: the row being dragged (from), the slot it would land in
// (over), how far the pointer has moved, and every row's box when it started.
interface Drag {
  from: number;
  over: number;
  dy: number;
  startY: number;
  rows: DOMRect[];
  pointerId: number;
}

// The hills you've picked, in order. Drag a row by its handle to reorder: it
// follows the pointer (mouse, touch or pen alike) while the rows it passes
// slide out of its way, and the new order is saved when it's let go. The handle
// also takes the up and down arrow keys, for reordering without a pointer.
function YourHills({
  picked,
  save,
  move,
  remove,
}: {
  picked: Place[];
  save: (ids: string[]) => void;
  move: (id: string, by: -1 | 1) => void;
  remove: (id: string) => void;
}) {
  const list = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  // Moving a row with the keyboard reorders the DOM, which can drop focus, so
  // it's put back on that row's handle after the render.
  const refocus = useRef<string | null>(null);
  useEffect(() => {
    const id = refocus.current;
    if (!id) return;
    refocus.current = null;
    list.current?.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus();
  });

  const start = (e: PointerEvent<HTMLButtonElement>, from: number) => {
    if (e.button !== 0 || !list.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rows = [...list.current.children].map((row) => row.getBoundingClientRect());
    setDrag({ from, over: from, dy: 0, startY: e.clientY, rows, pointerId: e.pointerId });
  };

  const follow = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dy = e.clientY - drag.startY;
    const box = drag.rows[drag.from];
    const centre = box.top + box.height / 2 + dy;
    // The slot is how many of the other rows the dragged row's centre has passed.
    const over = drag.rows.filter(
      (row, j) => j !== drag.from && row.top + row.height / 2 < centre
    ).length;
    setDrag({ ...drag, dy, over });
  };

  const drop = () => {
    if (!drag) return;
    if (drag.over !== drag.from) {
      const next = picked.map((p) => p.id);
      const [id] = next.splice(drag.from, 1);
      next.splice(drag.over, 0, id);
      save(next);
    }
    setDrag(null);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const by = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!by) return;
    e.preventDefault();
    refocus.current = id;
    move(id, by);
  };

  // Where each row sits while a drag is on: the dragged one under the pointer,
  // the ones between its old and new slot shifted one row towards the gap.
  const shift = (j: number): CSSProperties | undefined => {
    if (!drag) return undefined;
    if (j === drag.from) return { translate: `0 ${drag.dy}px` };
    const h = drag.rows[drag.from].height;
    if (drag.from < drag.over && j > drag.from && j <= drag.over) return { translate: `0 ${-h}px` };
    if (drag.from > drag.over && j >= drag.over && j < drag.from) return { translate: `0 ${h}px` };
    return { translate: "0 0" };
  };

  return (
    <ol ref={list} className="mt-2 divide-y divide-line-2 border-y border-line-2">
      {picked.map((p, i) => {
        const dragging = drag?.from === i;
        return (
          <li
            key={p.id}
            style={shift(i)}
            className={`relative flex items-center gap-3 bg-sunken py-2 ${
              dragging
                ? "z-10 shadow-lg shadow-black/30"
                : drag
                  ? "transition-[translate] duration-200 ease-out motion-reduce:transition-none"
                  : ""
            }`}
          >
            <button
              type="button"
              data-handle={p.id}
              onPointerDown={(e) => start(e, i)}
              onPointerMove={follow}
              onPointerUp={drop}
              onPointerCancel={() => setDrag(null)}
              onKeyDown={(e) => onKey(e, p.id)}
              aria-label={`Reorder ${p.name}, ${i + 1} of ${picked.length}. Drag, or use the up and down arrow keys.`}
              title="Drag to reorder"
              className={`-ml-1 flex h-9 w-6 shrink-0 touch-none select-none items-center justify-center rounded text-faint hover:text-ink focus-visible:text-ink ${
                dragging ? "cursor-grabbing text-ink" : "cursor-grab"
              }`}
            >
              <Grip />
            </button>
            <PlaceIcon place={p} />
            <span className="min-w-0 flex-1 truncate text-[15px]">{p.name}</span>
            <RowButton label={`Remove ${p.name}`} danger onClick={() => remove(p.id)}>
              <Cross />
            </RowButton>
          </li>
        );
      })}
    </ol>
  );
}

// Pick your hills: a sheet from the right, as a modal dialog, so it traps focus,
// closes on Escape and returns focus to the button that opened it. One column
// at every width: the hills you've picked, in order, to drag or remove, then
// every region's hills and zones to tick.
export default function MyHillsDrawer() {
  const { ids, save, toggle, move, remove } = useDashboard();
  const label = usePickerLabel();
  const { ref: drawer, open, close } = useSheet();
  const drawerId = MY_HILLS_DRAWER_ID;

  useEffect(() => {
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [open]);

  // Close on navigation, including browser back and forward.
  const pathname = usePathname();
  useEffect(() => {
    close();
  }, [pathname, close]);

  const places = GROUPS.flatMap((g) => g.places);
  const picked = ids
    .map((id) => places.find((p) => p.id === id))
    .filter((p): p is Place => p != null);

  return (
    <dialog
      id={drawerId}
      ref={drawer}
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md border-0 border-l border-line-2 bg-sunken p-0 text-ink shadow-2xl transition-[translate] duration-300 ease-out starting:open:translate-x-full data-closing:translate-x-full data-closing:ease-in backdrop:bg-black/50 backdrop:transition-[background-color] backdrop:duration-300 starting:open:backdrop:bg-transparent data-closing:backdrop:bg-transparent motion-reduce:transition-none motion-reduce:backdrop:transition-none"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-line-2 px-5 py-4">
          <div>
            {/* <h2 id={`${drawerId}-title`} className="text-2xl font-extrabold">
              Your Hills
            </h2> */}
            <p className="mt-1 text-sm text-muted">
              Check the ones you ride. They&apos;re saved on this device, no account
              needed.
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="orb orb-sm shrink-0">
            <Cross />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
          <section aria-labelledby={`${drawerId}-yours`} className="pt-5">
            <h3
              id={`${drawerId}-yours`}
              className="text-xs uppercase tracking-widest text-muted"
            >
              Your hills{picked.length > 0 && ` · ${picked.length}`}
            </h3>
            {picked.length > 0 ? (
              <YourHills picked={picked} save={save} move={move} remove={remove} />
            ) : (
              <p className="mt-2 border border-dashed border-line-2 px-3 py-3 text-sm text-muted">
                Nothing yet. Tick a few below and they&apos;ll show up here.
              </p>
            )}
          </section>

          <fieldset className="mt-6 space-y-5">
            <legend className="text-xs uppercase tracking-widest text-muted">Add more</legend>
            {GROUPS.map((g) => (
              <div key={g.region} className="pt-3">
                <p className="text-sm font-semibold text-ink">{g.region}</p>
                <ul className="-mx-2 mt-1">
                  {g.places.map((p) => (
                    <li key={p.id}>
                      <label
                        className="check-row text-[15px] text-ink"
                        style={{ "--orb": p.color } as CSSProperties}
                      >
                        <input
                          type="checkbox"
                          checked={ids.includes(p.id)}
                          onChange={() => toggle(p.id)}
                          className="sr-only"
                        />
                        <span className="check-box" aria-hidden="true">
                          <svg
                            viewBox="0 0 16 16"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 8.5 6.5 12 13 4.5" />
                          </svg>
                        </span>
                        <PlaceIcon place={p} />
                        <span className="min-w-0">
                          {p.name}
                          {p.kind === "Backcountry" && (
                            <span className="ml-1.5 text-xs text-muted">backcountry</span>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </fieldset>

          <p className="mt-6 text-xs text-faint">
            You can also add any hill from{" "}
            <Link
              href="/hills"
              transitionTypes={NAV_FADE}
              onClick={close}
              className="underline hover:text-ink"
            >
              All hills
            </Link>{" "}
            or its own page.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line-2 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {picked.length > 1 ? (
            <button type="button" onClick={() => save([])} className="orb-pill orb-pill-sm">
              Start over
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={close} className="orb-pill orb-pill-sm px-4" data-on>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
