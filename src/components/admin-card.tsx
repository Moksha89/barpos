import type { ReactNode } from "react";

export function AdminCard({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      {eyebrow ? (
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-gold-dark)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-base font-black text-stone-950 sm:text-lg">{title}</h2>
      {description ? <p className="mt-1 text-xs text-stone-600 sm:text-sm">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
