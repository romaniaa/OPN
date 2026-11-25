import type { ReactNode } from "react";
import { PageTransition } from "@/components/Transitions";
import { Eyebrow } from "@/components/Ui";
import { jsonLd } from "@/lib/Site";

// The classes of every page's title, for the one heading drawn elsewhere
// (the home page's Headline).
export const PAGE_TITLE = "text-4xl font-extrabold sm:text-5xl md:text-6xl";

// Every page's frame: the content column, sliding in and out on navigation.
// `banner` runs the full width of the window above it (a hill's snowfall alert),
// and stays stuck under the nav the whole way down. A page that renders its
// content in an async child keeps its own <PageTransition> around that child
// and passes `transition={false}`.
export function Page({
  children,
  banner,
  className = "space-y-5",
  transition = true,
}: {
  children: ReactNode;
  banner?: ReactNode;
  className?: string; // the column's spacing
  transition?: boolean;
}) {
  const main = (
    <main className="min-h-screen px-4 py-8 text-ink md:px-10">
      <div className={`mx-auto max-w-8xl ${className}`}>{children}</div>
    </main>
  );
  const page = banner ? (
    <div>
      {banner}
      {main}
    </div>
  ) : (
    main
  );
  return transition ? <PageTransition>{page}</PageTransition> : page;
}

// A page's header: an optional eyebrow, the title (with an optional icon before
// it), then whatever follows (an intro, controls).
export function PageHeader({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode; // left out when the page draws its own heading
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && (
        <h1
          className={`${PAGE_TITLE} ${eyebrow ? "mt-3" : ""} ${icon ? "flex items-center gap-3 sm:gap-4" : ""}`}
        >
          {icon}
          {icon ? <span className="min-w-0">{title}</span> : title}
        </h1>
      )}
      {children}
    </header>
  );
}

// The size of the icon beside a hill's or zone's page title.
export const TITLE_ICON = "h-8 w-[43px] sm:h-10 sm:w-[54px]";

// The small print at the foot of a page: where its data comes from.
export function PageFooter({ children, className = "pt-2" }: { children: ReactNode; className?: string }) {
  return <footer className={`pb-4 text-xs text-faint ${className}`}>{children}</footer>;
}

// Structured data for search engines.
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
  );
}
