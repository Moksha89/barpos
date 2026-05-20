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
    <section className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-lg font-black sm:text-xl">{title}</h2>
      {description ? <p className="mt-1 text-xs text-stone-600 sm:text-sm">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
