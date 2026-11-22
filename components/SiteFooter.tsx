import Link from "next/link";
import { NAV_FADE } from "@/components/Transitions";
import { ExternalArrow, PillLink } from "@/components/Ui";
import { SITE_NAME } from "@/lib/Site";

export const CREATOR_NAME = "Roman Hermens";
export const CREATOR_URL = "https://romanhermens.com";
// Where the footer's Support button goes: a Stripe Payment Link, where people
// choose what to give. Stripe hosts the checkout, so no payment details or keys
// touch this site. The button is hidden while this is empty.
export const SUPPORT_URL = "https://buy.stripe.com/cNi6oAaPp6fc8KRcNy6wE01";

// A small heart for the Support button.
function Heart() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 text-warm"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 14s-5.5-3.3-5.5-7.2A3 3 0 0 1 8 4.6a3 3 0 0 1 5.5 2.2C13.5 10.7 8 14 8 14Z" />
    </svg>
  );
}

// The site-wide footer under every page: who made it, a way to support the
// site, and the legal pages. Each
// page keeps its own data-source credits above this.
export default function SiteFooter() {
  return (
    <footer className="relative px-4 text-xs text-faint md:px-10">
      <div className="mx-auto flex max-w-8xl flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line py-5">
        <p>
          {SITE_NAME} · Made by{" "}
          <a
            href={CREATOR_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-0.5 underline hover:text-ink"
          >
            {CREATOR_NAME}
            <ExternalArrow className="h-3 w-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {SUPPORT_URL && (
            <PillLink href={SUPPORT_URL}>
              <Heart />
              Support {SITE_NAME}
            </PillLink>
          )}
          <nav aria-label="Legal">
            <ul className="flex gap-4">
              <li>
                <Link href="/privacy" transitionTypes={NAV_FADE} className="underline hover:text-ink">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" transitionTypes={NAV_FADE} className="underline hover:text-ink">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
