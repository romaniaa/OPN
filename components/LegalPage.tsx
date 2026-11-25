import type { ReactNode } from "react";
import { PAGE_TITLE, Page } from "@/components/Page";

// The shell for the privacy and terms pages: a narrow column of plain prose.
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <Page className="">
      <article className="mx-auto max-w-3xl text-ink-2 [&_a]:underline [&_a:hover]:text-ink [&_h2]:pt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <header className="page-header">
          <h1 className={`${PAGE_TITLE} text-ink`}>{title}</h1>
          <p className="text-sm text-faint">Last updated {updated}</p>
        </header>
        {children}
      </article>
    </Page>
  );
}
