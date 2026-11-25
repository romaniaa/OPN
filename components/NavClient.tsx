"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { Cross } from "@/components/Icons";
import Logo from "@/components/Logo";
import MountainsGlyph from "@/components/MountainsGlyph";
import MyHillsDrawer, {
  MY_HILLS_DRAWER_ID,
  openMyHills,
  usePickerLabel,
} from "@/components/MyHillsDrawer";
import PlaceIcon from "@/components/PlaceIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { NAV_BACK, NAV_FADE, NAV_FORWARD } from "@/components/Transitions";
import { useDashboard } from "@/components/useDashboard";
import { useSheet } from "@/components/useSheet";
import { REGIONS, type RegionId } from "@/config/regions";
import { DANGER_STYLE } from "@/lib/DangerStyle";
import { fmt } from "@/lib/Format";
import { PLACES_BY_REGION, placeById, type Place } from "@/lib/Place";
import type { NavStatus } from "@/lib/Places";

// Tabs: My hills (the home page), one per region, and Backcountry. A hill's page
// highlights its region; a zone's page highlights Backcountry.
type ItemId = "mine" | "backcountry" | RegionId;

const isRegion = (id: ItemId | null) => REGIONS.some((r) => r.id === id);

function activeItem(pathname: string): ItemId | null {
  if (pathname === "/") return "mine";
  if (pathname === "/backcountry" || pathname.startsWith("/backcountry/")) return "backcountry";
  const region = REGIONS.find((r) => pathname === `/${r.id}`);
  if (region) return region.id;
  const place = placeById(pathname.slice(1));
  return place?.kind === "hill" ? place.region : null;
}

// One hill or zone in the drawer: name, live status and freezing level.
function PlaceRow({
  place,
  status,
  current,
  onNavigate,
}: {
  place: Place;
  status: NavStatus["places"][string] | undefined;
  current: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={place.href}
        transitionTypes={NAV_FORWARD}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={`flex items-center gap-3 border-l-2 px-3 py-2.5 ${
          current ? "bg-ink/[0.06]" : "border-transparent hover:bg-ink/[0.04]"
        }`}
        style={current ? { borderLeftColor: place.color } : undefined}
      >
        <span className="flex w-5 shrink-0 justify-center" aria-hidden="true">
          <PlaceIcon place={place} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-ink">{place.fullName}</span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
            {status?.danger && (
              <span
                className={`h-2 w-2 shrink-0 ${DANGER_STYLE[status.danger].chip}`}
                aria-hidden="true"
              />
            )}
            <span className="truncate">
              {place.kind === "zone" ? "Backcountry · " : ""}
              {status?.status ?? "Status unavailable"}
            </span>
          </span>
        </span>
        {status?.freezingLevel != null && (
          <span className="shrink-0 text-right">
            <span className="block font-mono text-sm text-ink">
              {fmt(status.freezingLevel)}
              <span className="text-[10px] text-muted"> m</span>
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-faint">
              Freezing
            </span>
          </span>
        )}
      </Link>
    </li>
  );
}

// A link in the drawer: it closes the drawer, and marks itself when it's the
// page being shown.
function DrawerLink({
  href,
  pathname,
  onNavigate,
  back = false,
  className = "orb-pill orb-pill-sm",
  children,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  back?: boolean; // heading home, to My hills
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      transitionTypes={back ? NAV_BACK : NAV_FORWARD}
      onClick={onNavigate}
      aria-current={pathname === href ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

// A titled group in the drawer, with a link to its page on the right.
function DrawerSection({
  title,
  link,
  className = "mt-4",
  children,
}: {
  title: string;
  link: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`px-1 ${className}`}>
      <div className="flex items-baseline justify-between px-3 pb-1">
        <h2 id={id} className="text-sm text-muted">
          {title}
        </h2>
        {link}
      </div>
      {children}
    </section>
  );
}

function PlaceRows({
  places,
  status,
  pathname,
  onNavigate,
}: {
  places: Place[];
  status: NavStatus | null;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <ul>
      {places.map((p) => (
        <PlaceRow
          key={p.id}
          place={p}
          status={status?.places[p.id]}
          current={pathname === p.href}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  );
}

export default function NavClient({ status }: { status: NavStatus | null }) {
  const pathname = usePathname();
  // Where a tapped link is heading, so the tabs switch on the tap, the way an
  // app's do, instead of when the next page has loaded. Dropped once the URL
  // changes, after which the real pathname takes over.
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);
  const path = pending?.from === pathname ? pending.to : pathname;
  const active = activeItem(path);
  // My hills' count is unknown on the server, so it appears after hydration.
  const { hydrated, saved } = useDashboard();
  const pickerLabel = usePickerLabel();

  const { ref: drawer, open, close, onClick: onDrawerClick } = useSheet();
  // Next keeps recently visited pages mounted but hidden for instant back and
  // forward, so several navs can be in the document at once: ids must be unique.
  const drawerId = useId();

  // The desktop tabs share one underline that slides to the current tab. It's
  // placed by measuring that tab and setting the bar's style directly, so a tap
  // costs no re-render. It's placed again whenever a tab changes size (the My
  // hills count appearing, fonts loading), and fades out on pages with no tab.
  const tabRow = useRef<HTMLDivElement>(null);
  const underline = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const row = tabRow.current;
    const bar = underline.current;
    if (!row || !bar) return;
    const place = () => {
      const tab = row.querySelector<HTMLElement>("[data-tab][aria-current='page']");
      if (!tab) {
        bar.style.opacity = "0";
        return;
      }
      // Coming from nowhere (first paint, or a page with no tab), it appears in
      // place rather than sliding in from wherever it last was.
      const jump = bar.style.opacity !== "1";
      if (jump) bar.style.transition = "none";
      bar.style.width = `${tab.offsetWidth}px`;
      bar.style.translate = `${tab.offsetLeft}px ${tab.offsetTop + tab.offsetHeight - 2}px`;
      if (jump) {
        void bar.offsetWidth; // commit the jump before transitions come back
        bar.style.transition = "";
      }
      bar.style.opacity = "1";
    };
    place();
    const resized = new ResizeObserver(place);
    row.querySelectorAll("[data-tab]").forEach((tab) => resized.observe(tab));
    return () => resized.disconnect();
  }, [active]);

  const items: { id: ItemId; href: string; label: string; count?: number }[] = [
    { id: "mine", href: "/", label: "My hills", count: hydrated ? saved.length : undefined },
    ...REGIONS.map((r) => ({ id: r.id, href: `/${r.id}`, label: r.name })),
    { id: "backcountry", href: "/backcountry", label: "Backcountry" },
  ];
  // Region to region is a sideways move; My hills is home.
  const transitionTo = (id: ItemId) =>
    id === "mine" ? NAV_BACK : isRegion(id) && isRegion(active) ? NAV_FADE : NAV_FORWARD;

  const savedPlaces = saved.map(placeById).filter((p): p is Place => p != null);

  const quick = "orb-pill orb-pill-sm justify-center text-center";

  // Any plain click on a link inside the nav (tabs or drawer) that navigates in
  // place. Modified clicks open a new tab, so they leave the tabs alone.
  const onNavClick = (e: MouseEvent<HTMLElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest("a[href]");
    if (!(a instanceof HTMLAnchorElement) || a.target === "_blank") return;
    if (a.origin !== window.location.origin || a.pathname === pathname) return;
    setPending({ from: pathname, to: a.pathname });
  };

  return (
    // Named so it stays put while the page content slides beneath it. The name
    // makes the nav a stacking context, which would trap the floating bar's z-40
    // inside it and let later cards paint over the bar, so the nav itself sits
    // above the page.
    <nav
      aria-label="Main"
      onClick={onNavClick}
      style={{ viewTransitionName: "site-nav" }}
      className="relative z-40 border-b border-line-2 bg-page/70 px-4 md:px-10"
    >
      {/* Phones: the brand up top, and the controls in a bar floating at the
          bottom centre, within reach of a thumb. */}
      <div className="py-3 md:hidden">
        <Link href="/" transitionTypes={NAV_BACK} className="inline-flex py-0.5">
          <Logo className="h-6 w-auto" />
        </Link>
      </div>
      <div
        // Named so it stays put, like the nav, while the page changes beneath it.
        style={{ viewTransitionName: "mobile-nav" }}
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:hidden"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-edge bg-raised/85 p-1.5 shadow-lg shadow-black/25 backdrop-blur-md">
          {/* Icons only; the current page's tab grows to show its name. */}
          <Link
            href="/"
            transitionTypes={NAV_BACK}
            aria-current={active === "mine" ? "page" : undefined}
            data-on={active === "mine" || undefined}
            className="orb-pill nav-tab min-h-11 border-transparent bg-transparent px-3"
          >
            <MountainsGlyph className="h-[18px] w-6" />
            <span className="nav-tab-label">
              <span>My hills</span>
            </span>
            {hydrated && saved.length ? (
              <span className="orb-badge ml-1.5" aria-label={`${saved.length} saved`}>
                {saved.length}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-controls={drawerId}
            onClick={open}
            aria-label="All hills: every hill and zone, with live conditions"
            data-on={path === "/hills" || undefined}
            className="orb-pill nav-tab min-h-11 border-transparent bg-transparent px-3"
          >
            <svg viewBox="0 0 16 12" className="h-3 w-6 shrink-0" aria-hidden="true" fill="currentColor">
              <rect width="16" height="2" rx="1" />
              <rect y="5" width="16" height="2" rx="1" />
              <rect y="10" width="16" height="2" rx="1" />
            </svg>
            <span className="nav-tab-label">
              <span>All hills</span>
            </span>
          </button>
        </div>
      </div>

      {/* Larger screens: the tab row. */}
      <div
        ref={tabRow}
        className="relative mx-auto hidden max-w-8xl items-center gap-1 overflow-x-auto md:flex"
      >
        <Link href="/" transitionTypes={NAV_BACK} className="mr-4 shrink-0 py-3">
          <Logo className="h-6 w-auto" />
        </Link>
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href}
              transitionTypes={transitionTo(item.id)}
              aria-current={isActive ? "page" : undefined}
              data-tab
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm transition-colors ${
                isActive ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
              {item.count ? (
                <span className="orb-badge" aria-label={`${item.count} saved`}>
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Opens Pick your hills from any page. */}
          <button
            type="button"
            aria-haspopup="dialog"
            aria-controls={MY_HILLS_DRAWER_ID}
            onClick={openMyHills}
            aria-label={pickerLabel}
            title={pickerLabel}
            className="orb orb-sm"
          >
            <MountainsGlyph className="h-[13px] w-[18px]" />
          </button>
          <ThemeToggle />
        </div>
        <span
          ref={underline}
          aria-hidden="true"
          className="nav-underline pointer-events-none absolute top-0 left-0 h-0.5 bg-ink"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Pick your hills, from the right. Here in the nav so it's on every
          page; opened by the button above and by Pick your hills on My hills. */}
      <MyHillsDrawer />

      {/* A modal dialog, rising from the bottom bar as a sheet: it traps focus,
          closes on Escape, makes the page behind inert, and returns focus to the
          menu button when it closes. Tapping the backdrop (the dialog element
          itself, outside the panel) closes it too. */}
      <dialog
        id={drawerId}
        data-nav-drawer
        ref={drawer}
        aria-label="Site menu"
        onClick={onDrawerClick}
        className="fixed inset-x-0 top-auto bottom-0 m-0 h-[88dvh] max-h-none w-full max-w-none rounded-t-2xl border-0 border-t border-line-2 bg-sunken p-0 pb-[env(safe-area-inset-bottom)] text-ink shadow-2xl transition-[translate] duration-300 ease-out starting:open:translate-y-full data-closing:translate-y-full data-closing:ease-in backdrop:bg-black/50 backdrop:transition-[background-color] backdrop:duration-300 starting:open:backdrop:bg-transparent data-closing:backdrop:bg-transparent motion-reduce:transition-none motion-reduce:backdrop:transition-none"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line-2 px-4 py-3">
            <div>
              <Logo className="mb-1 h-5 w-auto" />
              <p className="text-xs text-faint">
                {status?.asOf
                  ? `Conditions as of ${status.asOf} · updated hourly`
                  : "Live conditions unavailable right now"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <button type="button" onClick={close} aria-label="Close menu" className="orb orb-sm">
                <Cross />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain pb-6">
            <div className="grid grid-cols-2 gap-2 px-4 py-4">
              <DrawerLink href="/backcountry" pathname={pathname} onNavigate={close} className={quick}>
                Backcountry
              </DrawerLink>
              <DrawerLink href="/hills" pathname={pathname} onNavigate={close} className={quick}>
                All hills
              </DrawerLink>
            </div>

            <DrawerSection
              title="My hills"
              className=""
              link={
                <DrawerLink href="/" pathname={pathname} onNavigate={close} back>
                  {savedPlaces.length ? "Open" : "Pick some"}
                </DrawerLink>
              }
            >
              {savedPlaces.length ? (
                <PlaceRows places={savedPlaces} status={status} pathname={pathname} onNavigate={close} />
              ) : (
                <p className="mx-3 border border-dashed border-line-2 px-3 py-3 text-sm text-muted">
                  Pin the hills you ski with{" "}
                  <span className="text-ink">+ Add to My hills</span> and they&apos;ll be
                  here.
                </p>
              )}
            </DrawerSection>

            {PLACES_BY_REGION.map((g) => (
              <DrawerSection
                key={g.region.id}
                title={g.region.name}
                link={
                  <DrawerLink href={`/${g.region.id}`} pathname={pathname} onNavigate={close}>
                    Region page
                  </DrawerLink>
                }
              >
                <PlaceRows places={g.places} status={status} pathname={pathname} onNavigate={close} />
              </DrawerSection>
            ))}

            <p className="mt-6 px-4 text-xs text-faint">
              Freezing level and rain or snow are model estimates. Avalanche danger
              from Avalanche Canada: read the full forecast before heading out.
            </p>
          </div>
        </div>
      </dialog>
    </nav>
  );
}
