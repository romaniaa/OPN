import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_TITLE, Page } from "@/components/Page";
import { PLACES } from "@/lib/Place";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Page transition={false} className="space-y-4">
      <h1 className={PAGE_TITLE}>Page not found</h1>
      <p className="text-ink-2">There&apos;s nothing at this address. Try one of the hills:</p>
      <ul className="flex flex-wrap gap-4">
        <li>
          <Link href="/" className="underline hover:text-ink">
            My hills
          </Link>
        </li>
        {PLACES.filter((p) => p.kind === "hill").map((p) => (
          <li key={p.id}>
            <Link href={p.href} className="underline hover:text-ink">
              {p.fullName}
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
