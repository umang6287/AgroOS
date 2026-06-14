import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function SectionCard({ title, eyebrow, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-emerald-900/10 bg-white p-5 shadow-sm">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wider text-leaf">{eyebrow}</p> : null}
      <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
