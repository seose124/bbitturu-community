import type { ReactNode } from "react";
import { Page, TopBar } from "@/components/layout";

export function InfoPage({
  title,
  children,
  date,
}: {
  title: string;
  children: ReactNode;
  date?: string;
}) {
  return (
    <Page>
      <div className="page-column">
        <TopBar title={title} backHref="/" />
        <div className="scroll-content info-scroll">
          <div className="info-body">{children}</div>
          {date ? <div className="info-date">{date}</div> : null}
        </div>
      </div>
    </Page>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="info-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
